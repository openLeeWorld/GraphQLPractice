
import {
    GraphQLSchema,
    printSchema,
    
} from 'graphql';

import QueryType from './queries';
import MutationType from './mutations';

import SubscriptionType from './subscription';

export const schema = new GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
    subscription: SubscriptionType,
});

console.log(printSchema(schema));





