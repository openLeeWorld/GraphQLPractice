import React, { useState } from 'react';

import { useStore } from '../store';
import Errors from './Errors';
import { FULL_TASK_FRAGMENT } from './TaskPage';
import { gql, useMutation } from '@apollo/client';
/** GIA NOTES
 * Define GraphQL operations here...
 */
const TASK_CREATE = gql`
  mutation taskCreate($input: TaskInput!) {
    taskCreate(input: $input) {
      errors {
        message
      }
      task {
        id
        ...FullTaskData
      }
    }
  }
  ${FULL_TASK_FRAGMENT}
`;

/* 기존 버전
export default function NewTask() {
  const {
    useLocalAppState,
    setLocalAppState,
    mutate,
    AppLink,
  } = useStore();
  const [uiErrors, setUIErrors] = useState([]);

  const user = useLocalAppState('user');

  if (!user) {
    return (
      <div className="box">
        <div className="center">
          Please login to create a Task record
        </div>
      </div>
    );
  }

  const handleNewTaskSubmit = async (event) => {
    event.preventDefault();
    const input = event.target.elements;

    //* GIA NOTES
    
     //* 1) Invoke the mutation create a new task:
     //*   - input.*.value has what a user types in an input box
    
     //* 2) Use the code below after that. It needs these variables:
     //*   - `errors` is an array of objects of type UserError
     //*   - `task` is the newly created Task object
    
    const { data, errors: rootErrors } = await mutate(TASK_CREATE, {
      variables: {
        input: {
          content: input.content.value,
          tags: input.tags.value.split(','),
          isPrivate: input.private.checked,
        },
      },
    });
    
    if (rootErrors) {
      return setUIErrors(rootErrors);
    }

    const { errors, task } = data.taskCreate;

    if (errors.length > 0) {
      return setUIErrors(errors);
    }
    
    setLocalAppState({
      component: { name: 'TaskPage', props: { taskId: task.id } },
    });
  };
*/

export default function NewTask() {
  const { useLocalAppState, setLocalAppState, AppLink } = useStore();
  const [uiErrors, setUIErrors] = useState([]);
  const [ taskCreate, { error, loading } ] = useMutation(TASK_CREATE); // 변경 작업을 정의하지만 호출하진 않는다.
  const user = useLocalAppState('user');

  if (error) {
    return <div className='error'>{error.message}</div>
  }

  if (loading) { // 쿼리가 대기중일 때 UI가 불러오는 중이라고 표시, 쿼리가 끝나면 컴포넌트를 렌더링하며 loading false
    return <div className="loading">Loading...</div>;
  }
  
  if (!user) {
    return (
      <div className="box">
        <div className="center">
          Please login to create a Task record
        </div>
      </div>
    );
  }

  const handleNewTaskSubmit = async (event) => {
    event.preventDefault();
    const input = event.target.elements;

    //* GIA NOTES
    
     //* 1) Invoke the mutation create a new task:
     //*   - input.*.value has what a user types in an input box
    
     //* 2) Use the code below after that. It needs these variables:
     //*   - `errors` is an array of objects of type UserError
     //*   - `task` is the newly created Task object
    
    const { data, errors: rootErrors } = await taskCreate({
      variables: {
        input: {
          content: input.content.value,
          tags: input.tags.value.split(','),
          isPrivate: input.private.checked,
        },
      },
    });
    
    if (rootErrors) {
      return setUIErrors(rootErrors);
    }

    const { errors, task } = data.taskCreate;

    if (errors.length > 0) {
      return setUIErrors(errors);
    }
    
    setLocalAppState({
      component: { name: 'TaskPage', props: { taskId: task.id } },
    });
  };

  return (
    <div className="main-container">
      <AppLink to="Home">{'<'} Cancel</AppLink>
      <div className="box box-primary">
        <form method="POST" onSubmit={handleNewTaskSubmit}>
          <div className="form-entry">
            <label>
              CONTENT
              <textarea
                name="content"
                placeholder="Describe the task. Be brief."
                required
              />
            </label>
          </div>
          <div className="form-entry">
            <label>
              TAGS
              <input
                type="text"
                name="tags"
                placeholder="Comma-separated words (javascript, git, react, ...)"
                required
              />
            </label>
          </div>

          <div className="form-entry">
            <label>
              <input type="checkbox" name="private" /> Make this a
              private entry (only for your account)
            </label>
          </div>
          <Errors errors={uiErrors} />
          <div className="spaced">
            <button className="btn btn-primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
