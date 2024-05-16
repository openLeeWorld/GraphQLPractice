import {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLList,
    GraphQLID,
} from 'graphql';

import UserError from './user-error';

const UserDeletePayload = new GraphQLObjectType({
    name: 'UserDeletePayload',
    fields: () => ({
        errors: {
            type: new GraphQLNonNull(
                new GraphQLList(new GraphQLNonNull(UserError))
            ),
        },
        deleteUserId: { type: GraphQLID },
    }),
});

export default UserDeletePayload;