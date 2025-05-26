const prisma = require('../../config/database');
const getAuthenticatedUser = require('../../helper/authHelper');
const { createMessage, updateMessage } = require('../../services/messageService');

const messagesResolver = {
    Query: {
        // async searchContact(_, { input }, { req }) {
        //     try {
        //         const sanitizedSearchTerm = input.searchTerm.trim();
        //         const { id } = getAuthenticatedUser(req);
        //         const contacts = await prisma.user.findMany({
        //             where: {
        //                 id: {
        //                     not: id,
        //                 },
        //                 OR: [
        //                     {
        //                         firstName: {
        //                             contains: sanitizedSearchTerm,
        //                             mode: "insensitive",
        //                         },
        //                     },
        //                     {
        //                         lastName: {
        //                             contains: sanitizedSearchTerm,
        //                             mode: "insensitive",
        //                         },
        //                     },
        //                     {
        //                         email: {
        //                             contains: sanitizedSearchTerm,
        //                             mode: "insensitive",
        //                         },
        //                     },
        //                 ],
        //             },
        //         });

        //         return contacts || []
        //     } catch (error) {
        //         throw new Error(error.message);
        //     }
        // },

        async getMessage(_, { input }, { req }) {
            try {
                const { id: user2 } = getAuthenticatedUser(req);
                const user1 = input.senderId;

                if (!user1 || !user2) {
                    throw new Error("Both user IDs are required!");
                }

                const messages = await prisma.messages.findMany({
                    where: {
                        OR: [
                            { senderId: user1, recipientId: user2 },
                            { senderId: user2, recipientId: user1 }
                        ]
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                });
                return messages.map(msg => ({
                    ...msg,
                    createdAt: msg.createdAt.toISOString(),
                }));
            } catch (error) {
                throw new Error(error.message);
            }
        },
    },

    Mutation: {
        async createMessage(_, { input }, { req }) {
            return await createMessage(input);
        },
        async updateMessage(_, { input }, { req }) {
            return await updateMessage(input);
        },
    },
};

module.exports = messagesResolver;
