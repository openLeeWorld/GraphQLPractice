import React, { useState } from 'react';

import { useStore } from '../store';
import Errors from './Errors';
import { gql, useMutation } from '@apollo/client';
/** GIA NOTES
 * Define GraphQL operations here...
 */
const USER_CREATE = gql`
  mutation userCreate($input: UserInput!) {
    userCreate(input: $input) {
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
/* 기존버전
export default function Signup() {
  const { mutate, setLocalAppState } = useStore();
  const [uiErrors, setUIErrors] = useState();
  const handleSignup = async (event) => {
    event.preventDefault();
    const input = event.target.elements;
    if (input.password.value !== input.confirmPassword.value) {
      return setUIErrors([{ message: 'Password mismatch' }]);
    }

    * GIA NOTES
     *
     * 1) Invoke the mutation to create a user record:
     * - input.*.value has what a user types in an input box
     *
     * 2) Use the code below after that. It needs these variables:
     *   - `errors` is an array of objects of type UserError
     *   - `user` is a user object response from the API
     *   - `authToken` is a string value response from the API
    
    const { data, errors: rootErrors } = 
      await mutate(USER_CREATE, {
        variables: {
          input: {
            firstName: input.firstName.value,
            lastName: input.lastName.value,
            username: input.username.value,
            password: input.password.value,
          },
        },
      });
*/

export default function Signup() {
  const { setLocalAppState } = useStore();
  const [uiErrors, setUIErrors] = useState();

  const [ createUser, { error, loading } ] = useMutation(USER_CREATE); // 변경 작업을 정의하지만 호출하진 않는다.

  if (error) {
    return <div className='error'>{error.message}</div>
  }

  if (loading) { // 쿼리가 대기중일 때 UI가 불러오는 중이라고 표시, 쿼리가 끝나면 컴포넌트를 렌더링하며 loading false
    return <div className="loading">Loading...</div>;
  }
  
  const handleSignup = async (event) => {
    event.preventDefault();
    const input = event.target.elements;

    if (input.password.value !== input.confirmPassword.value) {
      return setUIErrors([{ message: 'Password mismatch' }]);
    }
    
    const { data, errors: rootErrors } = 
      await createUser({
        variables: {
          input: {
            firstName: input.firstName.value,
            lastName: input.lastName.value,
            username: input.username.value,
            password: input.password.value,
          },
        },
      });

    if  (rootErrors) {
      return setUIErrors(rootErrors);
    }

    const { errors, user, authToken } = data.userCreate;

    if (errors.length > 0) {
      return setUIErrors(errors);
    }

    user.authToken = authToken;
    window.localStorage.setItem('azdev:user', JSON.stringify(user)); // locatStorage세션에 저장
    setLocalAppState({ user, component: { name: 'Home' } });
  };                

  return (
    <div className="sm-container">
      <form method="POST" onSubmit={handleSignup}>
        <div>
          <div className="form-entry">
            <label>
              FIRST NAME
              <input type="text" name="firstName" required />
            </label>
          </div>
          <div className="form-entry">
            <label>
              LAST NAME
              <input type="text" name="lastName" required />
            </label>
          </div>
          <div className="form-entry">
            <label>
              USERNAME
              <input type="text" name="username" required />
            </label>
          </div>
        </div>
        <div>
          <div className="form-entry">
            <label>
              PASSWORD
              <input type="password" name="password" required />
            </label>
          </div>
          <div>
            <div className="form-entry">
              <label>
                CONFIRM PASSWORD
                <input
                  type="password"
                  name="confirmPassword"
                  required
                />
              </label>
            </div>
          </div>
        </div>
        <Errors errors={uiErrors} />
        <div className="spaced">
          <button className="btn btn-primary" type="submit">
            Signup
          </button>
        </div>
      </form>
    </div>
  );
}
