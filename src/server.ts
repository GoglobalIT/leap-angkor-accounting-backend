//@Appollo Server v4
//@noted: Subscriptions are not supported by Apollo Server 4's startStandaloneServer function. 
//        To enable subscriptions, you must first swap to using the expressMiddleware
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
//@Appollo Server v4 with Subscriptions
import { expressMiddleware } from '@apollo/server/express4';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express  from 'express'
import bodyParser from 'body-parser';
import cors from 'cors';
//@Merg Schema
import {mergeTypeDefs, mergeResolvers} from "@graphql-tools/merge";
import path from 'path';
import {loadFilesSync} from '@graphql-tools/load-files';
//@General 
import 'dotenv/config'
import {connect} from 'mongoose'


const resolversFiles = loadFilesSync(path.join(__dirname, './graphql/resolvers'));
const typeDefsFiles = loadFilesSync(path.join(__dirname, './graphql/typeDefs'));

const resolvers = mergeResolvers(resolversFiles)
const typeDefs = mergeTypeDefs(typeDefsFiles)

//@Appollo server 4 with subscription
async function startServer(typeDefs: any, resolvers:any) {

    await connect(`${process.env.MONGO_URI}`)
      .then(() => console.log('DB Connected'))
      .catch(er => console.log('DB Connection Error', er));

    const app = express()
    const httpServer = createServer(app)

    // Creating the WebSocket server
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });

    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const serverCleanup = useServer(
      {
        schema
      },
      wsServer,
      );
    // Add plugins to your ApolloServer constructor to shutdown both the HTTP server and the WebSocketServer
    const server = new ApolloServer({
      schema,
      plugins: [
        // Proper shutdown for the HTTP server.
        ApolloServerPluginDrainHttpServer({ httpServer }),
        // Proper shutdown for the WebSocket server.
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],

    });

    await server.start();
    app.use(
      '/graphql', 
      cors<cors.CorsRequest>(), 
      bodyParser.json(), 
      expressMiddleware(server, {
        context: async ({ req }) => ({ req }),
      }),
      );

    httpServer.listen(+process.env.PORT, () => {
      console.log(`🚀 Server is now running on http://localhost:${+process.env.PORT}/graphql`);
    });
}

startServer(typeDefs, resolvers);

//@Appollo Server 4 startStandAloneServer
// async function startServer(typeDefs: any, resolvers:any) {

//     await connect(`${process.env.MONGO_URI}`)
//       .then(e => console.log('DB Connected'))
//       .catch(er => console.log('DB Connection Error', er));

//       const server = new ApolloServer({
//         typeDefs,
//         resolvers,
//       });
      
//       const { url } = await startStandaloneServer(server, {
//         context: async ({ req }) => ({ token: req.headers.authorization }),
//         listen: { port: +process.env.PORT },// +process.env.PORT meaning convert string to number
//       });

//       console.log(`🚀  Server ready at: ${url}`);
//   }

// startServer(typeDefs, resolvers);
