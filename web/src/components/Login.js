import React, { useState } from 'react';

import { useStore } from '../store';
import Errors from './Errors';
import { gql, useMutation } from '@apollo/client';
/** GIA NOTES
 * Define GraphQL operations here...
 */

const USER_LOGIN = gql`
  mutation userLogin($input: AuthInput!) {
    userLogin(input: $input) {
      errors {
        message
      }
      user {
        id
        username
      }
      authToken
    }
  }
`;
/* // provider mutate 버전
export default function Login() {
  const { mutate, setLocalAppState } = useStore();
  const [uiErrors, setUIErrors] = useState();
  const handleLogin = async (event) => {
    event.preventDefault();
    const input = event.target.elements;
    //* GIA NOTES
     //*
     //* 1) Invoke the mutation to authenticate a user:
     //*   - input.username.value has what a user types in the username input
     //*   - input.password.value has what a user types in the password input
     //* 2) Use the code below after that. It needs these variables:
     //*   - `errors` is an array of objects of type UserError
     //*   - `user` is a user object response from the API
     //*   - `authToken` is a string value response from the API
    
    const { data, errors: rootErrors } = await mutate(USER_LOGIN, {
      variables: {
        input: {
          username: input.username.value,
          password: input.password.value, 
        }, // 입력 데이터는 DOM API 호출을 통해 읽는다. (리액트 관리X)
      },
    });
    const { errors, user, authToken } = data.userLogin;

    if (errors.length > 0) { // 변경 실행 후 사용자 오류가 존재하는지 확인, UI를 통해 표시 
      return setUIErrors(errors); // 오류 메시지: "Invalid username or password"
    }
    user.authToken = authToken;
    window.localStorage.setItem('azdev:user', JSON.stringify(user)); // 사용자 세션 유지
    setLocalAppState({ user, component: { name: 'Home' } });
  };
*/
// useMutation(apollo hook function) 버전
export default function Login() {
  const { setLocalAppState } = useStore();
  const [uiErrors, setUIErrors] = useState();

  const [ loginUser, { error, loading } ] = useMutation(USER_LOGIN); // 변경 작업을 정의하지만 호출하진 않는다.

  if (error) {
    return <div className='error'>{error.message}</div>
  }

  if (loading) { // 쿼리가 대기중일 때 UI가 불러오는 중이라고 표시, 쿼리가 끝나면 컴포넌트를 렌더링하며 loading false
    return <div className="loading">Loading...</div>;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    const input = event.target.elements;
    //* GIA NOTES
     //*
     //* 1) Invoke the mutation to authenticate a user:
     //*   - input.username.value has what a user types in the username input
     //*   - input.password.value has what a user types in the password input
     //* 2) Use the code below after that. It needs these variables:
     //*   - `errors` is an array of objects of type UserError
     //*   - `user` is a user object response from the API
     //*   - `authToken` is a string value response from the API
    
    const { data, errors: rootErrors } = await loginUser({
      variables: {
        input: {
          username: input.username.value,
          password: input.password.value, 
        }, // 입력 데이터는 DOM API 호출을 통해 읽는다. (리액트 관리X)
      },
    });

    if  (rootErrors) {
      return setUIErrors(rootErrors);
    }

    const { errors, user, authToken } = data.userLogin;

    if (errors.length > 0) { // 변경 실행 후 사용자 오류가 존재하는지 확인, UI를 통해 표시 
      return setUIErrors(errors); // 오류 메시지: "Invalid username or password"
    }

    user.authToken = authToken;
    window.localStorage.setItem('azdev:user', JSON.stringify(user)); // 사용자 세션 유지
    setLocalAppState({ user, component: { name: 'Home' } });
  };

  return (
    <div className="sm-container">
      <form method="POST" onSubmit={handleLogin}>
        <div className="form-entry">
          <label>
            USERNAME
            <input type="text" name="username" required />
          </label>
        </div>
        <div className="form-entry">
          <label>
            PASSWORD
            <input type="password" name="password" required />
          </label>
        </div>
        <Errors errors={uiErrors} />
        <div className="spaced">
          <button className="btn btn-primary" type="submit">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}