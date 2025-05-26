const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { typeDefs, resolvers } = require('./graphql');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const setupSocket = require('./socket');


// Middlewares
const app = express();
dotenv.config();
const PORT = process.env.PORT || 4000;

const server = async () => {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });
    await server.start();
    app.use(cors({
        origin: ['*'],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-apollo-operation-name'],
        credentials: true,
    }));
    app.use(cookieParser());
    app.use(express.json());
    app.use('/graphql', expressMiddleware(server, {
        context: async ({ req, res }) => ({ req, res })
    }));
}

const serverInst = app.listen(PORT, () => {
    console.log(`Server Ready At http://localhost:${PORT}`);
    console.log(`Graphql Ready At http://localhost:${PORT}/graphql`);
});

setupSocket(serverInst);
server();