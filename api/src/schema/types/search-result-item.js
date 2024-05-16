import {
    GraphQLID,
    GraphQLInterfaceType,
    GraphQLNonNull,
    GraphQLString,
} from 'graphql';

import Task from './task';
import Approach from './approach';

const SearchResultItem = new GraphQLInterfaceType({
    name: "SearchResultItem",
    fields: () => ({
        id: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
    }),
    resolveType(obj) { // 대신 isTypeOf라는 함수 정의하면 graphql.js가 isTypeOf가 true를 반환한 첫번째 객체 타입을 선택
        if (obj.type === "task") {
            return Task;
        }
        if (obj.type === "approach") {
            return Approach;
        }
    },
});
// 이 타입으로 루트 검색 필드를 정의
export default SearchResultItem;