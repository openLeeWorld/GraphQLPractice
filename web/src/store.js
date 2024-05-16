import React, { useState } from 'react';
import fetch from 'cross-fetch';

import * as config from './config';
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  useQuery,
  gql,
  useApolloClient,
} from '@apollo/client';

import { setContext } from '@apollo/link-context'; // 아폴로용 신규 링크를 링크 체인에 포함

const cache = new InMemoryCache();
const httpLink = new HttpLink({ uri: config.GRAPHQL_SERVER_URL });
const client = new ApolloClient({ cache, link: httpLink });

const initialLocalAppState = {
  component: { name: 'Home', props: {} },
  user: JSON.parse(window.localStorage.getItem('azdev:user')),
};

export const LOCAL_APP_STATE = gql`
  query localAppState {
    component @client { 
      name
      props
    }
    user @client {
      username
      authToken
    }
  }
`; // @client지시문은 쿼리가 클라이언트 전용으로 서버에 전송되지 않는다는 것을 아폴로에 알린다. (캐시에서 데이터를 읽음)

/* 초기 버전
// The useStoreObject is a custom hook function designed
// to be used with React's context feature
export const useStoreObject = () => {
  // This state object is used to manage
  // all local app state elements (like user/component)
  const [state, setState] = useState(() => initialLocalAppState);

  // This function can be used with 1 or more
  // state elements. For example:
  // const user = useLocalAppState('user');
  // const [component, user] = useLocalAppState('component', 'user');
  const useLocalAppState = (...stateMapper) => {
    if (stateMapper.length === 1) {
      return state[stateMapper[0]];
    }
    return stateMapper.map((element) => state[element]);
  };

  // This function shallow-merges a newState object
  // with the current local app state object
  const setLocalAppState = (newState) => {
    if (newState.component) {
      newState.component.props = newState.component.props ?? {};
    }
    setState((currentState) => {
      return { ...currentState, ...newState };
    });
    // 로그인, 로그아웃 할 때 캐시를 초기화한다.
    if (newState.iser || newState.user === null) {
      client.resetStore();
    }
  };

  // This is a component that can be used in place of
  // HTML anchor elements to navigate between pages
  // in the single-page app. The `to` prop is expected to be
  // a React component (like `Home` or `TaskPage`)
  const AppLink = ({ children, to, ...props }) => {
    const handleClick = (event) => {
      event.preventDefault();
      setLocalAppState({
        component: { name: to, props },
      });
    };
    return (
      <a href={to} onClick={handleClick}>
        {children}
      </a>
    );
  };
  // apollo header에 토큰 추가용
  const authLink = setContext((_,  { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: state.user
          ? `Bearer ${state.user.authToken}`
          : '',
      },
    };
  });

  client.setLink(authLink.concat(httpLink));

  // This function should make an ajax call to GraphQL server
  // and return the GraphQL response object
  const request = async (requestText, { variables } = {}) => {
    
      const headers = state.user
      ? { Authorization: 'Bearer ' + state.user.authToken }
      : {};

      const gsResp = await fetch(config.GRAPHQL_SERVER_URL, {
        method: 'post',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: requestText, variables }),
      }).then((response) => response.json());
      return gsResp;
  }; // request는 AJAX에서 쓴다.
  //query, mutation은 apollo client에서 request대신 컴포넌트들의 쿼리 및 변경을 수행한다.
  const query = async ( query, { variables } = {}) => {
    const resp = await client.query({ query, variables });
    return resp;
  };

  const mutate = async (mutation, { variables } = {}) => {
    const resp = await client.mutate({ mutation, variables });
    return resp;
  };

  // In React components, the following is the object you get
  // when you make a useStore() call
  return {
    useLocalAppState,
    setLocalAppState,
    AppLink,
    request,
    query,
    mutate,
    client,
  };
};

// Define React's context object and the useStore
// custom hook function that'll use it
const AZContext = React.createContext();
export const Provider = AZContext.Provider;
export const useStore = () => React.useContext(AZContext);
*/
// 위는 리액트 컴포넌트 컨텍스트, 아래는 아폴로 로컬 앱 컨텍스트
export const useStore = () => {
  const client = useApolloClient();

  const useLocalAppState = (...stateMapper) => {
    const { data } = useQuery(LOCAL_APP_STATE);
    if (stateMapper.length === 1) {
      return data[stateMapper[0]];
    }
    return stateMapper.map((element) => data[element]);
  };

  const setLocalAppState = (newState) => {
    if (newState.component) {
      newState.component.props = newState.component.props ?? {};
    }
    const currentState = client.readQuery({
      query: LOCAL_APP_STATE,
    });

    const updateState = () => {
      client.writeQuery({
        query: LOCAL_APP_STATE,
        data: { ...currentState, ...newState },
      });
    };
    if (newState.user || newState.user === null) {
      client.onResetStore(updateState); // resetStore는 모든 로컬 앱 상태 데이터를 삭제할 수 있다.
      client.resetStore();
    } else {
      updateState();
    }
  };

  const AppLink = ({ children, to, ...props }) => {
    const handleClick = (event) => {
      event.preventDefault();
      setLocalAppState({
        component: { name: to, props },
      });
    };
    return (
      <a href={to} onClick={handleClick}>
        {children}
      </a>
    );
  };

  return {
    useLocalAppState,
    setLocalAppState,
    AppLink,
  };
}; // 리액트 컨텍스트 코드는 삭제
