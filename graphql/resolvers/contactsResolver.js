const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const getAuthenticatedUser = require('../../helper/authHelper');

const contactsResolver = {
    Query: {
        async searchContact(_, { input }, { req }) {
            try {
                const sanitizedSearchTerm = input.searchTerm.trim();
                const { id } = getAuthenticatedUser(req);
                const contacts = await prisma.user.findMany({
                    where: {
                        id: {
                            not: id,
                        },
                        OR: [
                            {
                                firstName: {
                                    contains: sanitizedSearchTerm,
                                    mode: "insensitive",
                                },
                            },
                            {
                                lastName: {
                                    contains: sanitizedSearchTerm,
                                    mode: "insensitive",
                                },
                            },
                            {
                                email: {
                                    contains: sanitizedSearchTerm,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                });

                return contacts || []
            } catch (error) {
                throw new Error(error.message);
            }
        },
        async getAllContacts(_, __, { req }) {
            try {
                const users = await prisma.user.findMany({
                    where: {
                        id: {
                            not: req.userId,
                        },
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                });

                const contacts = users.map((user) => ({
                    label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
                    value: user.id
                }));

                return contacts;
            } catch (error) {
                throw new Error(error.message);
            }
        },
        async getContactsForDMList(_, __, { req }) {
            try {
                const { id: senderId } = getAuthenticatedUser(req);

                // Fetch latest messages involving the user
                const messages = await prisma.messages.findMany({
                    where: {
                        OR: [
                            { senderId: senderId },
                            { recipientId: senderId }
                        ]
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                // Create a map to get the latest message per contact
                const contactMap = new Map();

                for (const message of messages) {
                    const otherUserId = message.senderId === senderId
                        ? message.recipientId
                        : message.senderId;

                    // Skip if null or same as sender
                    if (!otherUserId || otherUserId === senderId) continue;

                    if (!contactMap.has(otherUserId)) {
                        contactMap.set(otherUserId, {
                            id: otherUserId,
                            lastMessageTime: message.createdAt,
                        });
                    }
                }

                const contactsWithInfo = await Promise.all(
                    Array.from(contactMap.values()).map(async (contact) => {
                        if (!contact.id) return null; // Defensive check

                        const user = await prisma.user.findUnique({
                            where: { id: contact.id },
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                image: true,
                                color: true
                            }
                        });

                        if (!user) return null; // Skip if user not found

                        return {
                            ...user,
                            lastMessageTime: contact.lastMessageTime.toISOString()
                        };
                    })
                );

                // Filter out any null results
                const validContacts = contactsWithInfo.filter(Boolean);

                // Sort by most recent message time
                validContacts.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

                return validContacts;
            } catch (error) {
                throw new Error(error.message);
            }
        }

    },

    Mutation: {

    },
};

module.exports = contactsResolver;
