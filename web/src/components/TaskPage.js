import React, { useState, useEffect } from 'react';

import { useStore } from '../store';
import NewApproach from './NewApproach';
import Approach, { APPROACH_FRAGMENT } from './Approach';
import TaskSummary, { TASK_SUMMARY_FRAGMENT } from './TaskSummary';
import { gql, useQuery, useSubscription } from '@apollo/client';
/** GIA NOTES
 * Define GraphQL operations here...
 */

export const FULL_TASK_FRAGMENT = `
  fragment FullTaskData on Task {
    id
    ...TaskSummary
    approachList {
      id
      ...ApproachFragment
    }
  }
  ${TASK_SUMMARY_FRAGMENT}
  ${APPROACH_FRAGMENT}
`;

const TASK_INFO = gql`
  query taskInfo($taskId: ID!) {
    taskInfo(id: $taskId) {
      ...FullTaskData
    }
  }
  ${FULL_TASK_FRAGMENT}
`;

const VOTE_CHANGED = gql`
  subscription voteChanged($taskId: ID!) {
    voteChanged(taskId: $taskId) {
      id
      voteContent
    }
  }
`;
/* // 기존버전: Provider와 query 버전
export default function TaskPage({ taskId }) {
  const { query, AppLink } = useStore();
  const [taskInfo, setTaskInfo] = useState(null);
  const [showAddApproach, setShowAddApproach] = useState(false);
  const [highlightedApproachId, setHighlightedApproachId] = useState();

  useEffect(() => {
    if (!taskInfo) {
      //* GIA NOTES
       //*
       //*  1) Invoke the query to get the information of a Task object:
       //*     (You can't use `await` here but `promise.then` is okay)
       //*
       //*  2) Change the line below to use the returned data instead of mockTaskInfo:
       //*
      
      query(TASK_INFO, { variables: { taskId } }).then(
        ({ data }) => {
          setTaskInfo(data.taskInfo);
        },
      );
    }
  }, [taskId, taskInfo, query]);

  if (!taskInfo) {
    return <div className="loading">Loading...</div>;
  }

  const handleAddNewApproach = (newApproach) => {
    setTaskInfo((pTask) => ({
      ...pTask,
      approachList: [newApproach, ...pTask.approachList],
    }));
    setHighlightedApproachId(newApproach.id);
    setShowAddApproach(false);
  };
*/
// ApolloProvider와 useQuery버전
export default function TaskPage({ taskId }) {
  const { AppLink } = useStore();
  //const [taskInfo, setTaskInfo] = useState(null);
  const [showAddApproach, setShowAddApproach] = useState(false);
  const [highlightedApproachId, setHighlightedApproachId] = useState();

  const { error, loading, data } = useQuery(TASK_INFO, {
    variables: { taskId },
  });

  useSubscription(VOTE_CHANGED, {
    variables: { taskId },
  });

  if (error) {
    return <div className="error">{error.message}</div>
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  const { taskInfo } = data;

  const handleAddNewApproach = (addNewApproach) => {
    /*
    setTaskInfo((pTask) => ({
      ...pTask,
      approachList: [newApproach, ...pTask.approachList],
    }));
    */
    const newApproachId = addNewApproach(taskInfo); //  이미 정의된 taskInfo 객체를 사용해서 캐시를 업데이트 하는 콜백 
    setHighlightedApproachId(newApproachId);
    setShowAddApproach(false);
  };


  return (
    <div>
      <AppLink to="Home">{'<'} Home</AppLink>
      <TaskSummary task={taskInfo} />
      <div>
        <div>
          {showAddApproach ? (
            <NewApproach
              taskId={taskId}
              onSuccess={handleAddNewApproach}
            />
          ) : (
            <div className="center y-spaced">
              <button
                onClick={() => setShowAddApproach(true)}
                className="btn btn-secondary"
              >
                + Add New Approach
              </button>
            </div>
          )}
        </div>
        <h2>Approaches ({taskInfo.approachList.length})</h2>
        {taskInfo.approachList.map((approach) => (
          <div key={approach.id} id={approach.id}>
            <Approach
              approach={approach}
              isHighlighted={highlightedApproachId === approach.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
