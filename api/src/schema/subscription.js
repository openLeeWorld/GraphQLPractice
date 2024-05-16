import { GraphQLNonNull, GraphQLObjectType, GraphQLID } from "graphql";

import { pubsub } from '../pubsub';
import Task from './types/task';
import Approach from './types/approach';

const SubscriptionType = new GraphQLObjectType({
    name: 'Subscription',
    fields: () => ({
        taskMainListChanged: {
            type: new GraphQLNonNull(Task),
            resolve: async (source) => {
                return source.newTask; // 구독해야 할 이벤트
            },
            subscribe: async () => {
                return pubsub.asyncIterator(['TASK_MAIN_LIST_CHANGED']); // 인수가 페이로드 데이터를 가진다
            },
        },
        voteChanged: {
            type: new GraphQLNonNull(Approach),
            args: {
                taskId: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve: async (source) => {
                return source.updatedApproach;
            },
            subscribe: async (source, { taskId }) => {
                return pubsub.asyncIterator([`VOTE_CHANGED_${taskId}`]);
            },
        },
    }),
});

export default SubscriptionType;
