import React, { useState, useEffect } from 'react';

//import { useStore } from '../store';
import Search from './Search';
import TaskSummary, { TASK_SUMMARY_FRAGMENT } from './TaskSummary';
import { gql, useQuery } from '@apollo/client';

/** GIA NOTES
 * Define GraphQL operations here...
 */
const TASK_MAIN_LIST = gql`
  query taskMainlist {
    taskMainList {
      id
      ...TaskSummary
    }
  }
  ${TASK_SUMMARY_FRAGMENT}
`;
/* //기존 버전
const mockTasks = [
  {
    id: 1,
    content: 'Mock content #1',
    author: { username: 'mock-author' },
    tags: ['tag1', 'tag2'],
  },
  {
    id: 2,
    content: 'Mock content #2',
    author: { username: 'mock-author' },
    tags: ['tag1', 'tag2'],
  },
  {
    id: 3,
    content: 'Mock content #3',
    author: { username: 'mock-author' },
    tags: ['tag1', 'tag2'],
  },
];
// provider와 query, mutate 버전
export default function Home() {
  const { query } = useStore();
  const [taskList, setTaskList] = useState(null);

  useEffect(() => {
    //* GIA NOTES
     //*
     //*  1) Invoke the query to get list of latest Tasks
     //*     (You can't use `await` here but `promise.then` is okay)
     //*
     //*  2) Change the setTaskList call below to use the returned data:
     //*
    
    query(TASK_MAIN_LIST).then(({ data }) => {
      setTaskList(data.taskMainList);
    }); // 응답(.then promisse객체)을 받으면 리액트가 이를 인식하고, 새 데이터로 DOM 트리를 자동 갱신한다.
  }, [query]);

  if (!taskList) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <Search />
      <div>
        <h1>Latest</h1>
        {taskList.map((task) => (
          <TaskSummary key={task.id} task={task} link={true} />
        ))}
      </div>
    </div>
  );
}
*/
// ApolloProvider 버전

export default function Home() {
  const { error, loading, data } = useQuery(TASK_MAIN_LIST); // 쿼리를 실행하고 그래프QL응답 객체와 로딩 상태를 반환한다.
  if (error) {
    return <div className="error">{error.message}</div> // 해당 값은 객체로 오류메시지 속성을 포함
  }
  if (loading) { // 쿼리가 대기중일 때 UI가 불러오는 중이라고 표시, 쿼리가 끝나면 컴포넌트를 렌더링하며 loading false
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <Search />
      <div>
        <h1>Latest</h1>
        {data.taskMainList.map((task) => (
          <TaskSummary key={task.id} task={task} link={true} />
        ))}
      </div>
    </div>
  );
}
