/* 첫번째 쿼리 서버 설정
import { buildSchema } from 'graphql';

export const schema = buildSchema(`
    type Query {
        currentTime: String!
    }`
);

export const rootValue = { //그래프QL.js가 그래프의 루로 사용함(최상위 노드용 리졸버)
    currentTime : () => {
        const isoString = new Date().toISOString();
        return isoString.slice(11, 19); // 시간을 표현하는 부분인 11~19텍스트를 자른다.
    }
}
*/
import {
    GraphQLID,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLList
} from 'graphql';

import NumbersInRange from './types/numbers-in-range';
import { numbersInRangeObject } from '../utils';

import Task from './types/task';
import SearchResultItem from './types/search-result-item';
//import User from './types/user';
import { Me } from './types/user';

const QueryType = new GraphQLObjectType({
    name: "Query",
    fields: () => ({
        currentTime: {
            type: GraphQLString,
            resolve: () => {
                return new Promise ((resolve) => {
                    setTimeout(() => {
                        const isoString = new Date().toISOString();
                        resolve(isoString.slice(11, 19));
                    }, 100); //이걸 포함한 응답은 0.1초후에 
                });
            },
        },
        sumNumbersInRange: {
            type: new GraphQLNonNull(GraphQLInt),
            args: {
                begin: { type: new GraphQLNonNull(GraphQLInt) },
                end: { type: new GraphQLNonNull(GraphQLInt) },
            },
            resolve : function(source, { begin, end }) {
                let sum = 0;
                for (let i = begin; i <= end; i++) {
                    sum += i;
                }
                return sum;
            },
        },
        numbersInRange: {
            type: NumbersInRange,
            args: {
                begin: {type: new GraphQLNonNull(GraphQLInt) },
                end: { type: new GraphQLNonNull(GraphQLInt) },
            },
            resolve: function (source, { begin, end}) {
                return numbersInRangeObject(begin, end);
            },
        },
        taskMainList: {
            type: new GraphQLList(new GraphQLNonNull(Task)),
            resolve: async (source, args, { loaders }) => {
                return loaders.tasksByTypes.load('latest');
            },
        },
        taskInfo: {
            type: Task,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve: async (source, args, { loaders }) => {
                return loaders.tasks.load(args.id); // 리졸브 함수의 args객체에서 전달된 id인수를 읽는다.
            }
        },
        search: {
            type: new GraphQLNonNull(
                new GraphQLList(new GraphQLNonNull(SearchResultItem)),
            ),
            args: {
                term: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: async (source, args, { loaders }) => {
                return loaders.searchResults.load(args.term); // 사용자가 지정한 검색어를 args객체의 term필드 인수를 통해 읽음
            },
        },
        me: { // sql문, 데이터로더를 사용하지 않는 특수한 필드
            type: Me,
            resolve: async (source, args, { currentUser }) => {
                return currentUser;
            },
        },
    }),
});

export default QueryType;





