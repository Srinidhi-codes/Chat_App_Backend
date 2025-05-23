const { readFileSync, readdirSync } = require("fs");
const path = require("path");

// Fix 1: Correct imports (no destructuring)
const authResolver = require('./resolvers/authResolver');
const userResolver = require('./resolvers/userResolver');
const contactsResolver = require('./resolvers/contactsResolver');
const messagesResolver = require('./resolvers/messageResolver');
const channelsResolver = require('./resolvers/channelsResolver');

// Utility to load all .graphql typeDefs
const loadTypeDefs = (dir) => {
    const files = readdirSync(dir).filter(file => file.endsWith('.graphql'));
    return files.map(file => readFileSync(path.join(dir, file), 'utf-8')).join('\n');
};

const typeDefs = loadTypeDefs(path.join(__dirname, './typeDefs'));

// Fix 2: Fallback safely even if resolver parts are missing
const resolvers = {
    Query: {
        ...(authResolver.Query || {}),
        ...(userResolver.Query || {}),
        ...(contactsResolver.Query || {}),
        ...(messagesResolver.Query || {}),
        ...(channelsResolver.Query || {}),
    },
    Mutation: {
        ...(authResolver.Mutation || {}),
        ...(userResolver.Mutation || {}),
        ...(contactsResolver.Mutation || {}),
        ...(messagesResolver.Mutation || {}),
        ...(channelsResolver.Mutation || {}),
    },
};

module.exports = { typeDefs, resolvers };
