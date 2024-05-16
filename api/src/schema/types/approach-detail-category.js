import { GraphQLEnumType } from "graphql";

const ApproachDetailCategory = new GraphQLEnumType({
    name: 'ApproachDetailCategory',
    values: {
        NOTE: { value: 'notes' },
        EXPLANATION: { value: 'explanations' },
        WARNING: { value: 'warnings' },
    },
});
// api사용자는 대문자 데이터를 보지만 db로 갈때는 소문자로 변환한다.
export default ApproachDetailCategory;