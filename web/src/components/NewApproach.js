import React, { useState, useEffect } from 'react';

import { useStore } from '../store';
import Errors from './Errors';
import { APPROACH_FRAGMENT } from './Approach';
import { gql, useQuery, useMutation } from '@apollo/client';
/** GIA NOTES
 * Define GraphQL operations here...
 */

const DETAIL_CATEGORIES = gql`
  query getDetailCategories {
    detailCategories: __type(name: "ApproachDetailCategory") { 
      enumValues {
        name
      }
    }
  }
`; // GraphQL introspective query(내향성 필드)를 써서 ApproachDetailCategory가 어떤 값을 지원하는 지 물음

const APPROACH_CREATE = gql`
  mutation approachCreate($taskId: ID!, $input: ApproachInput!) {
    approachCreate(taskId: $taskId, input: $input) {
      errors {
        message
      }
      approach {
        id
        ...ApproachFragment
      }
    }
  }
  ${APPROACH_FRAGMENT}
`;
/* // 기존버전
export default function NewApproach({ taskId, onSuccess }) {
  const { useLocalAppState, query, mutate } = useStore();
  const [detailCategories, setDetailCategories] = useState([]);
  const [detailRows, setDetailRows] = useState([0]);
  const [uiErrors, setUIErrors] = useState([]);

  useEffect(() => {
    if (detailCategories.length === 0) {
      //* GIA NOTES
       //*
       //* 1) Invoke the query to get the detail categories:
       //*    (You can't use `await` here but `promise.then` is okay)
       //*
       //* 2) Use the line below on the returned data:

        setDetailCategories(API_RESP_FOR_detailCategories);
      
      query(DETAIL_CATEGORIES).then(({ data }) => {
        setDetailCategories(data.detailCategories.enumValues);
      });
    }
  }, [detailCategories, query]);

  const user = useLocalAppState('user');

  if (!user) {
    return (
      <div className="box">
        <div className="center">
          Please login to add a new Approach record to this Task
        </div>
      </div>
    );
  }

  const handleNewApproachSubmit = async (event) => {
    event.preventDefault();
    setUIErrors([]);
    const input = event.target.elements;
    const detailList = detailRows.map((detailId) => ({
      category: input[`detail-category-${detailId}`].value,
      content: input[`detail-content-${detailId}`].value,
    }));
    //* GIA NOTES
     //*
     //* 1) Invoke the mutation to create a new approach:
     //*   - Variable `taskId` is for the parent Task of this new Approach
     //*   - detailList is an array of all the input for the details of this new Approach
     //*   - input.*.value has what a user types in an input box
     //*
     //* 2) Use the code below after that. It needs these variables:
     //*   - `errors` is an array of objects of type UserError
     //*   - `approach` is the newly created Approach object
    
    const { data, errors: rootErrors } = await mutate(
      APPROACH_CREATE,
      {
        variables: {
          taskId,
          input: {
            content: input.content.value,
            detailList,
          },
        },
      },
    );

    if (rootErrors) {
      return setUIErrors(rootErrors);
    }

    const { errors, approach } = data.approachCreate;

    if (errors.length > 0) {
      return setUIErrors(errors);
    }
    onSuccess(approach);
  };
*/
// useQuery, useMutation 버전
export default function NewApproach({ taskId, onSuccess }) {
  const { useLocalAppState} = useStore();
  const [detailRows, setDetailRows] = useState([0]);
  const [uiErrors, setUIErrors] = useState([]);
  const user = useLocalAppState('user');

  const { error: dcError, loading: dcLoading, data } = useQuery(
    DETAIL_CATEGORIES,
  );

  const [ createApproach, { error, loading }] = useMutation(
    APPROACH_CREATE,
    {
      update(cache, { data: { approachCreate } }) {
        if (approachCreate.approach) {
          // 태스크용 캐시 수정 (ID: taskId)
          // 그리고 신규 approachCreate.approach 레코드 추가
          onSuccess((taskInfo) => {
            cache.modify({
              id: cache.identify(taskInfo),
              fields: {
                approachList(currentList) {
                  return [approachCreate.approach, ...currentList]; // approachList필드를 수정하고 신규 접근법 추가
                },
              },
            });
            return approachCreate.approach.id;
          });
        }
      },
    },
  );

  if (dcLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (dcError || error) {
    return <div className="error">{error.message}</div>;
  }

  const detailCategories = data.detailCategories.enumValues;

  if (!user) {
    return (
      <div className="box">
        <div className="center">
          Please login to add a new Approach record to this Task
        </div>
      </div>
    );
  }

  const handleNewApproachSubmit = async (event) => {
    event.preventDefault();
    setUIErrors([]);
    const input = event.target.elements;
    const detailList = detailRows.map((detailId) => ({
      category: input[`detail-category-${detailId}`].value,
      content: input[`detail-content-${detailId}`].value,
    }));
    //* GIA NOTES
     //*
     //* 1) Invoke the mutation to create a new approach:
     //*   - Variable `taskId` is for the parent Task of this new Approach
     //*   - detailList is an array of all the input for the details of this new Approach
     //*   - input.*.value has what a user types in an input box
     //*
     //* 2) Use the code below after that. It needs these variables:
     //*   - `errors` is an array of objects of type UserError
     //*   - `approach` is the newly created Approach object
    
    const { data, errors: rootErrors } = await createApproach({
        variables: {
          taskId,
          input: {
            content: input.content.value,
            detailList,
          },
        },
      },
    );

    if (rootErrors) {
      return setUIErrors(rootErrors);
    }

    const { errors } = data.approachCreate;

    if (errors.length > 0) {
      return setUIErrors(errors);
    }
    // 데이터 처리는 모두 update함수에서 이루어진다.
  };


  return (
    <div className="main-container">
      <div className="box box-primary">
        <form method="POST" onSubmit={handleNewApproachSubmit}>
          <div className="form-entry">
            <label>
              APPROACH
              <textarea name="content" placeholder="Be brief!" />
            </label>
          </div>
          <div className="form-entry">
            <label>
              DETAILS
              {detailRows.map((detailId) => (
                <div key={detailId} className="details-row">
                  <select name={`detail-category-${detailId}`}>
                    {detailCategories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name={`detail-content-${detailId}`}
                    placeholder="Be brief!"
                  />
                </div>
              ))}
            </label>
            <button
              type="button"
              className="y-spaced"
              onClick={() =>
                setDetailRows((rows) => [...rows, rows.length])
              }
            >
              + Add more details
            </button>
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
