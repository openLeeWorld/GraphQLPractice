import pgClient from "./pg-client";
import sqls from "./sqls";
import { randomString } from "../utils";

const pgApiWrapper = async () => {
    const { pgPool } = await pgClient();
    const pgQuery = (text, params = {}) => 
        pgPool.query(text, Object.values(params));

    return {
        // 아래는 쿼리용
        /* taskByTypes로 대체됨
        taskMainList: async() => {
            const pgResp = await pgQuery(sqls.tasksLatest);
            return pgResp.rows;
        },*/
        usersInfo: async (userIds) => {
            const pgResp = await pgQuery(sqls.usersFromIds, { $1: [userIds] }); // $1을 [userId]로 설정해 sql문에 전달
            return userIds.map((userId) =>
            pgResp.rows.find((row) => userId === row.id)
            ); // 입력 배열에 .map호출을 사용해서 출력 배열이 같은 길이와 순서를 가지게 한다.
        },
        approachLists: async (taskIds) => {
                const pgResp = await pgQuery(sqls.approachesForTaskIds, {
                    $1: [taskIds],
                });
                return taskIds.map((taskId) => 
                pgResp.rows.filter((row) => taskId === row.taskId)
            );
        },
        tasksInfo: async ({ taskIds, currentUser }) => {
            const pgResp = await pgQuery(sqls.tasksFromIds, {
                $1: taskIds,
                $2: currentUser? currentUser.id : null, 
            });
            return taskIds.map((taskId) => 
            pgResp.rows.find((row) => taskId == row.id)
            ); // 약한 등호 연산자를 사용하고 있는것에 유의(정수(row.id)와 문자열(taskId을 비교))
        },
        tasksByTypes: async (types) => {
            const results = types.map(async (type) => {
                if (type === 'latest') {
                    const pgResp = await pgQuery(sqls.tasksLatest);
                    return pgResp.rows;
                }
                throw Error('Unsupported type');
            });
            return Promise.all(results);
        },
        searchResults: async ({ searchTerms, currentUser }) => {
            const results = searchTerms.map(async (searchTerm) => {
                const pgResp = await pgQuery(sqls.searchResults, {
                    $1: searchTerm,
                    $2: currentUser? currentUser.id : null, 
                });
                return pgResp.rows;
            });
            return Promise.all(results);
        },
        userFromAuthToken: async (authToken) => {
            if (!authToken) {
                return null;
            }
            const pgResp = await pgQuery(sqls.userFromAuthToken, {
                $1: authToken,
            });
            return pgResp.rows[0];
        },
        tasksForUsers: async (userIds) => {
            const pgResp = await pgQuery(sqls.tasksForUsers, {
                $1: userIds,
            });
            return userIds.map((userId) => 
                pgResp.rows.filter((row) => userId === row.userId),
            );
        },
        // 아래부터 mutators 필드
        mutators: {
            userCreate: async ({ input }) => {
                const payload = { errors: [] };
                if (input.password.length < 6) {
                    payload.errors.push({
                        message: 'Use a stronger password',
                    });
                }
                if ( payload.errors.length === 0) {
                    const authToken = randomString();
                    try {
                        const pgResp = await pgQuery(sqls.userInsert, { // azdev.users테이블에 레코드 추가
                            $1: input.username.toLowerCase(),
                            $2: input.password,
                            $3: input.firstName,
                            $4: input.lastName,
                            $5: authToken,
                        });

                        if (pgResp.rows[0]) {
                            payload.user = pgResp.rows[0];
                            payload.authToken = authToken;
                        }
                    } catch (err) {
                        console.error(err); // err객체를 확인해서 페이로드로 사용자 지정 오류메시지 던짐
                    }
                }
                return payload;
            },
            userLogin: async ({ input }) => {
                const payload = {errors: [] };
                if (!input.username || !input.password) {
                    payload.errors.push({
                        message: 'Invalid username or password',
                    });
                }
                if (payload.errors.length === 0) {
                    const pgResp = await pgQuery(sqls.userFromCredentials, {
                        $1: input.username.toLowerCase(),
                        $2: input.password,
                    });
                    const user = pgResp.rows[0];
                    if (user) {
                        const authToken = randomString();
                        await pgQuery(sqls.userUpdateAuthToken, {
                            $1: user.id,
                            $2: authToken,
                        });
                        payload.user = user;
                        payload.authToken = authToken;
                    } else {
                        payload.errors.push({
                            message: 'Invalid  username or password'
                        });
                    }
                }
                return payload;
            },
            taskCreate: async ({ input, currentUser }) => {
                const payload = { errors: [] };
                if (input.content.length < 15) {
                    payload.errors.push({
                        message: 'Text is too short',
                    });
                }
                if (payload.errors.length === 0) {
                    const pgResp = await pgQuery(sqls.taskInsert, {
                        $1: currentUser.id,
                        $2: input.content,
                        $3: input.tags.join(', '), // tag는 csv형태로 db에 저장되지만 api사용자는 문자열 배열로 보낸다.
                        $4: input.isPrivate,
                    });

                    if (pgResp.rows[0]) {
                        payload.task = pgResp.rows[0];
                    }
                }
                return payload;
            },
            approachCreate: async ({
                taskId,
                input,
                currentUser,
                mutators,
            }) => {
                const payload = { errors: [] };
                    if (payload.errors.length === 0 ) {
                        const pgResp = await pgQuery(sqls.approachInsert, {
                            $1: currentUser.id,
                            $2: input.content,
                            $3: taskId,
                        });
                        if (pgResp.rows[0]) {
                            payload.approach = pgResp.rows[0];
                            await pgQuery(sqls.approachCountIncrement, {
                                $1: taskId,
                            });
                            await mutators.approachDetailCreate(
                                payload.approach.id,
                                input.detailList,
                            );
                        }
                    }
                    return payload;
            },
            approachVote: async ({ approachId, input }) => {
                const payload = { errors: [] };
                const pgResp = await pgQuery(sqls.approachVote, {
                    $1: approachId,
                    $2: input.up ? 1: -1,
                });
                if (pgResp.rows[0]) {
                    payload.approach = pgResp.rows[0];
                }

                return payload;
            },
            userDelete: async ({ currentUser }) => {
                const payload = { errors :[] };
                try {
                    await pgQuery(sqls.userDelete, {
                        $1: currentUser.id,
                    });
                    payload.deleteUserId = currentUser.id;
                } catch (err) {
                    payload.errors.push({
                        message: 'We were not able to delete this account',
                    });
                }
                return payload;
            },
        },
    };
};

export default pgApiWrapper;