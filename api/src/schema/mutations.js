import { GraphQLObjectType, GraphQLNonNull, GraphQLID, } from "graphql";

import UserPayload from "./types/payload-user";
import UserInput from "./types/input-user";
import AuthInput from "./types/input-auth";
import TaskPayload from "./types/payload-task";
import TaskInput from "./types/input-tasks";
import ApproachPayload from "./types/payload-approach";
import ApproachInput from "./types/input-approach";
import ApproachVoteInput from "./types/input-approach-vote";
import UserDeletePayload from "./types/payload-user-delete";
import { pubsub } from '../pubsub';

const MutationType = new GraphQLObjectType({
    name: "Mutation",
    fields: () => ({
        userCreate: {
            type: new GraphQLNonNull(UserPayload),
            args: {
                input: { type: new GraphQLNonNull(UserInput) },
            },
            resolve: async (source, { input }, { mutators }) => {
                return mutators.userCreate({ input });
            },
        },
        userLogin: {
            type: new GraphQLNonNull(UserPayload),
            args: {
                input: { type: new GraphQLNonNull(AuthInput) },
            },
            resolve: async (source, { input }, { mutators }) => {
                return mutators.userLogin({ input });
            },
        },
        taskCreate: {
            type: TaskPayload,
            args: {
                input: { type: new GraphQLNonNull(TaskInput) },
            },
            resolve: async (
                source, 
                { input },
                { mutators, currentUser },
            ) => {
                const { errors, task } = await mutators.taskCreate({
                    input, 
                    currentUser,
                });
                
                if (errors.length === 0 && !task.isPrivate) {
                    pubsub.publish(`TASK_MAIN_LIST_CHANGED`, {
                        newTask: task, // event payload
                    }); // 태스크 객체가 비공개일 때만 발행됨
                }
                //return mutators.taskCreate({ input, currentUser }); 구독 전 버전
                return { errors, task };
            },
        },
        approachCreate: {
            type: ApproachPayload,
            args: {
                taskId: { type: new GraphQLNonNull(GraphQLID) },
                input: { type: new GraphQLNonNull(ApproachInput) },
            },
            resolve: async (
                source,
                { taskId, input },
                { mutators, currentUser },
            ) => {
                return mutators.approachCreate({
                    taskId,
                    input,
                    currentUser,
                    mutators, //변경 작업 객체가 여기서 전달됨(postgre추가후 mongo에 추가 가능)
                });
            },
        },
        approachVote: {
            type: ApproachPayload, 
            args: {
                approachId: { type: new GraphQLNonNull(GraphQLID) },
                input: { type: new GraphQLNonNull(ApproachVoteInput) },
            },
            resolve: async (
                source,
                { approachId, input },
                { mutators },
            ) => {
                const { errors, approach } = await mutators.approachVote({
                    approachId,
                    input,
                });
                
                if (errors.length === 0) {
                    pubsub.publish(`VOTE_CHANGED_${approach.taskId}`, {
                        updatedApproach: approach, // event payload
                    }); // 특정 변수에 의존하는 구독 작업(taskId)
                }
                return { errors, approach };
                //return mutators.approachVote({ approachId, input }); 기존 버전
            },
        },
        userDelete: {
            type: UserDeletePayload,
            resolve: async (source, args, { mutators, currentUser }) => {
                return mutators.userDelete({ currentUser });
            },
        },
    }),
});

export default MutationType;