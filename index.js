const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { typeDefs, resolvers } = require('./graphql');
const cookieParser = require('cookie-parser');
const path = require('path');
const uploadRoute = require('./routes/upload');
const setupSocket = require('./socket');

dotenv.config();
const PORT = process.env.PORT || 4000;

const app = express();

const startServer = async () => {
    // Start Apollo Server
    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
    });
    await apolloServer.start();

    // Apply middlewares BEFORE listen
    app.use(cors({
        origin: [process.env.ORIGIN],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-apollo-operation-name'],
        credentials: true,
    }));
    app.use(cookieParser());
    app.use(express.json());

    // Serve uploaded files
    app.use('/uploads', express.static(path.join(__dirname, './uploads')));

    // Upload route
    app.use('/api', uploadRoute);

    // Apollo GraphQL endpoint
    app.use('/graphql', expressMiddleware(apolloServer, {
        context: async ({ req, res }) => ({ req, res }),
    }));

    // Start HTTP server
    const serverInst = app.listen(PORT, () => {
        console.log(`Server Ready At http://localhost:${PORT}`);
        console.log(`Graphql Ready At http://localhost:${PORT}/graphql`);
    });

    // Setup socket
    setupSocket(serverInst);
};

startServer();
