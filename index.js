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
    // Initialize Apollo Server
    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
    });
    await apolloServer.start();

    // CORS Middleware (can be redundant if vercel.json headers work fully)
    app.use(cors({
        origin: 'https://chat-app-frontend-dkfz.vercel.app',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-apollo-operation-name']
    }));

    // Other middlewares
    app.use(cookieParser());
    app.use(express.json());

    // Serve static files (uploads)
    app.use('/uploads', express.static(path.join(__dirname, './uploads')));

    // Upload route
    app.use('/api', uploadRoute);

    // Apollo GraphQL middleware
    app.use('/graphql', expressMiddleware(apolloServer, {
        context: async ({ req, res }) => ({ req, res }),
    }));

    // Start server
    const serverInst = app.listen(PORT, () => {
        console.log(`🚀 Server Ready at http://localhost:${PORT}`);
        console.log(`🔗 GraphQL at http://localhost:${PORT}/graphql`);
    });

    // Setup Socket.IO
    setupSocket(serverInst);
};

startServer();
