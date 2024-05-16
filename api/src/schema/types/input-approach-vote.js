import {
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLBoolean,
} from 'graphql';

const ApproachVoteInput = new GraphQLInputObjectType({
    name: 'ApproachVoteInput',
    description: 'true for up-vote and false for down-vote',
    fields: () => ({
        up: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
});

export default ApproachVoteInput;