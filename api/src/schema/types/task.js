import {
    GraphQLID,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLList
} from "graphql";
import User from "./user";
//import { extractPrefixedColumns } from "../../utils";
import  Approach  from './approach';
import SearchResultItem from "./search-result-item";

const Task = new GraphQLObjectType({
    name: "Task",
    interfaces: () => [SearchResultItem],
    fields: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        tags: {
            type: new GraphQLNonNull(
                new GraphQLList(new GraphQLNonNull(GraphQLString))
            ),
            resolve: (source) => source.tags.split(','),
        },
        approachCount: { type: new GraphQLNonNull(GraphQLInt) },
        createdAt: { type: new GraphQLNonNull(GraphQLString),
                    resolve: (source) => source.createdAt.toISOString(),
        },
        author: {
            type: new GraphQLNonNull(User),
            resolve: (source, args, { loaders }) =>
                loaders.users.load(source.userId),
        },
        approachList: {
            type: new GraphQLNonNull(
                new GraphQLList(new GraphQLNonNull(Approach))
            ),
            resolve: (source, args, { loaders }) =>
                loaders.approachLists.load(source.id),
        },
    },
});

export default Task;