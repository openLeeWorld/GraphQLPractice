/* 초창기 버전
import { graphqlHTTP } from 'express-graphql';
import { schema, rootValue } from './schema';

const executeGraphQLRequest = async request => {
  const resp = await graphql(schema, request, rootValue);
  console.log(resp.data);
};

executeGraphQLRequest(process.argv[2]);
*/
/////////////////////////////////////////////////////////////////
/* GIA NOTES
 *
 * Use the code below to start a bare-bone express web server
*/
/*
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';

import * as config from './config';
import { graphqlHTTP } from 'express-graphql';
import { schema } from './schema';
//import pgClient from './db/pg-client';
import pgApiWrapper from './db/pg-api';
import DataLoader from 'dataloader';
import mongoApiWrapper from './db/mongo-api';

async function main() {
  //const { pgPool } = await pgClient();
  const pgApi = await pgApiWrapper();
  const mongoApi = await mongoApiWrapper();
  const server = express();
  server.use(cors());
  server.use(morgan('dev'));
  server.use(bodyParser.urlencoded({ extended: false }));
  server.use(bodyParser.json());
  server.use('/:fav.ico', (req, res) => res.sendStatus(204));

  // Express server version
  server.use('/', async (req, res) => {
    const authToken = 
      req && res.header &&  req.headers.authorization? req.headers.authorization.slice(7) // "Bearer"
        :null;
    const currentUser = await pgApi.userFromAuthToken(authToken);
    if(authToken && !currentUser) {
      return res.status(401).send({ //Unauthorized
        errors: [{ message: 'Invalid access token'}],
      });
    }
    const loaders = {
      users: new DataLoader((userIds) => 
        pgApi.usersInfo(userIds)
      ),
      approachLists: new DataLoader((taskIds) => 
        pgApi.approachLists(taskIds),
      ),
      tasks: new DataLoader((taskIds) => 
        pgApi.tasksInfo( {taskIds, currentUser} )
      ),
      tasksByTypes: new DataLoader((types) =>
        pgApi.tasksByTypes(types),
      ),
      searchResults: new DataLoader((searchTerms) => 
        pgApi.searchResults({ searchTerms, currentUser} ),
      ),
      detailLists: new DataLoader((approachIds) => 
        mongoApi.detailLists(approachIds)
      ),
      tasksForUsers: new DataLoader((userIds) => 
        pgApi.tasksForUsers(userIds),
      ),
    };
    const mutators = {
      ...pgApi.mutators,
      ...mongoApi.mutators,
    };
    graphqlHTTP({
      schema,
      //rootValue,
      context: { pgApi, loaders, mutators, currentUser }, //pgApi 제거 가능
      graphiql: { headerEditorEnabled: true},
      customFormatErrorFn: (err) => {
          const errorReport = {
            message: err.message,
            locations: err.locations,
            stack: err.stack? err.stack.split('\n') : [], // 개발 환경 오류 스택 보여줌
            path: err.path,
          };
          console.log('GraphQL Error', errorReport); //서버 로그 기록
          return config.isDev
            ? errorReport
            : {message : 'Oops! Something went wrong! :('}; // 운영 서버에선 알기 쉬운 오류
        }
      })(req, res);
    }  
  );
  

   //This line rus the Express server
  server.listen(config.port, () => {
    console.log(`Server URL: http://localhost:${config.port}/`); // 4321 api server
  });
  
}; 
main();
/*
////////////////////////////////////////////////////////////////////////////////////
/* GIA NOTES
*
* Use the code below to start a bare-bone express web server
*/

import * as config from "./config";
import { schema } from "./schema";
import pgApiWrapper from "./db/pg-api";
import DataLoader from "dataloader";
import mongoApiWrapper from "./db/mongo-api";

import { ApolloServer } from "apollo-server";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";

// Express -> Apollo server refractoring
async function main() {

const pgApi = await pgApiWrapper();
const mongoApi = await mongoApiWrapper();

const server = new ApolloServer({
    schema,
    subscriptions: {
      path: "/graphql",
      onConnect: (connectionParams, websocket, context) => {
          console.log("WebSocket Client connected");
      },
      onDisconnect: (websocket, context) => {
          console.log("WebSocket Client disconnected");
      },
    },
    formatError: (err) => {
    const errorReport = {
        message: err.message,
        locations: err.locations,
        stack: err.stack ? err.stack.split("\n") : [],
        path: err.path,
    };
    console.error("GraphQL Error", errorReport);
    return config.isDev
        ? errorReport
        : { message: "Oops! Something went wrong! :(" };
    },
    context: async ({ req }) => {
    const authToken =
        req && req.headers && req.headers.authorization
        ? req.headers.authorization.slice(7) // "Bearer"
        : null;

    const currentUser = await pgApi.userFromAuthToken(authToken);

    if (authToken && !currentUser) {
        throw Error("Invalid access token");
    }

    const loaders = {
        users: new DataLoader((userIds) => pgApi.usersInfo(userIds)),
        approachLists: new DataLoader((taskIds) =>
        pgApi.approachLists(taskIds)
        ),
        tasks: new DataLoader((taskIds) =>
        pgApi.tasksInfo({ taskIds, currentUser })
        ),
        tasksByTypes: new DataLoader((types) => pgApi.tasksByTypes(types)),
        searchResults: new DataLoader((searchTerms) =>
        pgApi.searchResults({ searchTerms, currentUser })
        ),
        detailLists: new DataLoader((approachIds) =>
        mongoApi.detailLists(approachIds)
        ),
        tasksForUsers: new DataLoader((userIds) =>
        pgApi.tasksForUsers(userIds)
        ),
    };

    const mutators = {
        ...pgApi.mutators,
        ...mongoApi.mutators,
    };

    return { loaders, mutators, currentUser };
    },
});

const subscriptionServer = SubscriptionServer.create(
  {
  schema,
  execute,
  subscribe,
  onConnect: (connectionParams, websocket) => {
      console.log("WebSocket Client connected");
  },
  onDisconnect: (websocket) => {
      console.log("WebSocket Client disconnected");
  },
  },
  {
  server: server.httpServer,
  path: "/graphql",
  }
);

//This line rus the Apllo api server with WS

server
    .listen({ port: config.port })
    .then(({ url }) => {
        console.log(`Server Url: ${url}`);
});


/*
// 아래는 웹소켓 서버를 포트 4000에서 구현하기 위함임
const serverWS = new ApolloServer({
    schema,
    subscriptions: {
    path: "/graphql",
    onConnect: (connectionParams, websocket, context) => {
        console.log("WebSocket Client connected");
    },
    onDisconnect: (websocket, context) => {
        console.log("WebSocket Client disconnected");
    },
    },
});

const WS_PORT = 4000;

serverWS.listen(WS_PORT).then(({ url }) => {
    console.log(`Subscription Server: ${url}graphql`);
});

const subscriptionServer = SubscriptionServer.create(
    {
    schema,
    execute,
    subscribe,
    onConnect: (connectionParams, websocket) => {
        console.log("WebSocket Client connected");
    },
    onDisconnect: (websocket) => {
        console.log("WebSocket Client disconnected");
    },
    },
    {
    server: serverWS.httpServer,
    path: "/graphql",
    }
);
*/
}

main();



