import { PubSub } from 'graphql-subscriptions';
const pubsub = new PubSub();
export { pubsub }; // api 서버 코드 어디에서건 발행/구독 객체를 사용