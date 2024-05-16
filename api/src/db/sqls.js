const views = {
  taskAndUsers: `
  SELECT t.*,
    u.id AS "author_id",
    u.username AS "author_username", 
    u.first_name AS "author_firstname",
    u.last_name AS "author_lastname",
    u.created_at AS "author_createdat"
  FROM azdev.tasks t
  JOIN azdev.users u ON (t.user_id = u.id)
  `,
}; // 서브쿼리할 땐 별칭을 소문자로 통일해야 인식된다.

export default {
  // ------
  // SELECT
  /* 기존 버전: 
  tasksLatest: `
    SELECT id, content, tags, user_id AS "userId", approach_count AS "approachCount", is_private AS "isPrivate", created_at AS "createdAt"
    FROM azdev.tasks
    WHERE is_private = FALSE
    ORDER BY created_at DESC
    LIMIT 100
  `, 나중 버전 아래
  */ 

  tasksLatest: `
    SELECT o.id, o.content, o.tags, o.user_id AS "userId", o.approach_count AS "approachCount", o.is_private AS "isPrivate", o.created_at AS "createdAt",
      o.author_id, o.author_username, o.author_firstname AS "author_firstName",
      o.author_lastname AS "author_lastName", o.author_createdat AS "author_createdAt"
    FROM (${views.taskAndUsers}) AS o
    WHERE is_private = FALSE
    ORDER BY created_at DESC
    LIMIT 100
  `,

  // $1: userIds
  usersFromIds: `
    SELECT id, username, first_name AS "firstName", last_name AS "lastName", created_at AS "createdAt"
    FROM azdev.users
    WHERE id = ANY ($1)
  `,

  // $1: taskIds
  approachesForTaskIds: `
    SELECT id, content, user_id AS "userId", task_id AS "taskId", vote_count AS "voteCount", created_at AS "createdAt"
    FROM azdev.approaches
    WHERE task_id = ANY ($1) 
    ORDER BY vote_count DESC, created_at DESC
  `, 

  // $1: taskIds
  // $2: userId (can be null)
  tasksFromIds: `
    SELECT id, content, tags, user_id AS "userId", approach_count AS "approachCount", is_private AS "isPrivate", created_at AS "createdAt"
    FROM azdev.tasks
    WHERE id = ANY ($1)
    AND (is_private = FALSE OR user_id = $2)
  `,

  // $1: searchTerm
  // $2: userId (can be null)
  // viewable_tasks: 인라인 뷰, 
  // to_tsvector, websearch_to_tsquery, ts_rank는 postgresql 함수
  searchResults: `
    WITH viewable_tasks AS (
      SELECT *
      FROM azdev.tasks n
      WHERE (is_private = FALSE OR user_id = $2)
    )
    SELECT id, "taskId", content, tags, "approachCount", "voteCount", "userId", "createdAt", type,
            ts_rank(to_tsvector(content), websearch_to_tsquery($1)) AS rank
    FROM (
      SELECT id, id AS "taskId", content, tags, approach_count AS "approachCount", null AS "voteCount", user_id AS "userId", created_at AS "createdAt", 'task' AS type
      FROM viewable_tasks
      UNION ALL
      SELECT a.id, t.id AS "taskId", a.content, null AS tags, null AS "approachCount", a.vote_count AS "voteCount", a.user_id AS "userId", a.created_at AS "createdAt", 'approach' AS type
      FROM azdev.approaches a JOIN viewable_tasks t ON (t.id = a.task_id)
    ) search_view
    WHERE to_tsvector(content) @@ websearch_to_tsquery($1)
    ORDER BY rank DESC, type DESC
  `,

  // $1: userIds
  tasksForUsers: `
    SELECT id, content, tags, user_id AS "userId", approach_count AS "approachCount", is_private AS "isPrivate", created_at AS "createdAt"
    FROM azdev.tasks
    WHERE user_id = ANY ($1)
    ORDER by created_at DESC
  `,

  // $1: authToken
  userFromAuthToken: `
    SELECT id, username, first_name AS "firstName", last_name AS "lastName"
    FROM azdev.users
    WHERE hashed_auth_token = crypt($1, hashed_auth_token)
  `,

  // $1: username
  // $2: password
  userFromCredentials: `
    SELECT id, username, first_name AS "firstName", last_name AS "lastName"
    FROM azdev.users
    WHERE username = $1
    AND hashed_password = crypt($2, hashed_password)
  `,

  // ------
  // INSERT

  // $1: username
  // $2: password
  // $3: firstName (can be null)
  // $4: lastName (can be null)
  // $5: authToken
  userInsert: `
    INSERT INTO azdev.users (username, hashed_password, first_name, last_name, hashed_auth_token)
    VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, crypt($5, gen_salt('bf')))
    RETURNING id, username, first_name AS "firstName", last_name AS "lastName", created_at AS "createdAt"
  `,

  // $1: userId
  // $2: content
  // $3: tags
  // $4: TRUE if private
  taskInsert: `
    INSERT INTO azdev.tasks (user_id, content, tags, is_private)
    VALUES ($1, $2, $3, $4)
    RETURNING id, content, tags, user_id AS "userId", approach_count AS "approachCount", is_private AS "isPrivate", created_at AS "createdAt";
  `,

  // $1: userId
  // $2: content
  // $3: taskId
  approachInsert: `
    INSERT INTO azdev.approaches (user_id, content, task_id)
    VALUES ($1, $2, $3)
    RETURNING id, content, user_id AS "userId", task_id AS "taskId", vote_count AS "voteCount", created_at AS "createdAt";
  `,

  // ------
  // UPDATE

  // $1: userId
  // $2: new authToken
  userUpdateAuthToken: `
    UPDATE azdev.users
    SET hashed_auth_token = crypt($2, gen_salt('bf'))
    WHERE id = $1;
  `,

  // $1: approachId
  // $2: voteIncrement
  approachVote: `
    UPDATE azdev.approaches
    SET vote_count = vote_count + $2
    WHERE id = $1
    RETURNING id, content, user_id AS "userId", task_id AS "taskId", vote_count AS "voteCount", created_at AS "createdAt";
  `,

  // $1: taskId
  approachCountIncrement: `
    UPDATE azdev.tasks t
    SET approach_count = (select count(id) from azdev.approaches where task_id = t.id)
    WHERE id = $1
    RETURNING id, content, tags, user_id AS "userId", approach_count AS "approachCount", is_private AS "isPrivate", created_at AS "createdAt";
  `,

  // ------
  // DELETE

  // $1: userId
  userDelete: `
    DELETE FROM azdev.users
    WHERE id = $1;
  `,
};
