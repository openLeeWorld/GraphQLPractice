//Apllo Cache version
import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom';

import { LOCAL_APP_STATE } from './store';
import Root from './components/Root';
import { ApolloProvider, ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

import * as config from './config';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from "@apollo/client/link/ws";

const httpLink = new HttpLink({ uri: config.GRAPHQL_SERVER_URL });
const cache = new InMemoryCache();

const authLink = setContext((_, { headers }) => {
  const { user } = client.readQuery({ query: LOCAL_APP_STATE });
  return {
    headers: {
      ...headers,
      authorization: user ? `Bearer ${user.authToken}` : '',
    },
  };
});

const wsLink = new WebSocketLink({
  uri: config.GRAPHQL_SUBSCRIPTIONS_URL,
  options: { reconnect: true }, // 재연결 true
}); 

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query); // split의 첫번째 인수는 함수로 호출할 작업을 받는다.
    return (
      definition.kind === "OperationDefinition" &&  // 메인 작업이 구독이면 true가 된다.
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink),
); 

const client = new ApolloClient({
  //link: authLink.concat(httpLink), 
  link: splitLink,
  cache 
});

const initialLocalAppState = {
  component: { name: 'Home', props: {} },
  user: JSON.parse(window.localStorage.getItem('azdev:user')),
};

client.writeQuery({ // 로컬 앱 상태를 업데이트하는 새로운 방법
  query: LOCAL_APP_STATE,
  data: initialLocalAppState,
});

export default function App() {
  return (
    <ApolloProvider client={client}>
        <Root /> 
    </ApolloProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
/*
//react, graphQL with AJAX version
import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom';

import { useStoreObject, Provider as StoreProvider } from './store';
import Root from './components/Root';
import { ApolloProvider } from '@apollo/client';

export default function App() {
  const store = useStoreObject();
  return (
    <ApolloProvider client={store.client}>
      <StoreProvider value={store}>
        <Root />
      </StoreProvider>
    </ApolloProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
*/

/*
// apollo client version
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  gql,
} from '@apollo/client';

import 'regenerator-runtime/runtime';
import * as config from './config';

const cache = new InMemoryCache();
const httpLink = new HttpLink({ uri: config.GRAPHQL_SERVER_URL });
const client = new ApolloClient({ cache, link: httpLink });

async function main() {
  const resp1 = await client.query({
    query: gql`
        {
          taskMainList {
            id
            content
            tags
            createdAt
          }
        }
    `,
  });

  console.log(resp1.data);

  const resp2 = await client.query({
    query: gql`
        {
          taskMainList {
            content
          }
        }
    `,
  });

  console.log(resp2.data);
}

main();
*/