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

// Manually handle CORS
const allowedOrigins = [process.env.ORIGIN]; // e.g., 'https://chat-app-frontend-dkfz.vercel.app'

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-apollo-operation-name');
    }

    // Preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

app.use(cookieParser());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// Upload route
app.use('/api', uploadRoute);

// Start Apollo Server
const startServer = async () => {
    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
    });
    await apolloServer.start();

    // Apollo GraphQL middleware
    app.use('/graphql', expressMiddleware(apolloServer, {
        context: async ({ req, res }) => ({ req, res }),
    }));

    // Start HTTP server
    const serverInst = app.listen(PORT, () => {
        console.log(`Server ready at http://localhost:${PORT}`);
        console.log(`GraphQL ready at http://localhost:${PORT}/graphql`);
    });

    // Setup Socket.io
    setupSocket(serverInst);
};

startServer();
