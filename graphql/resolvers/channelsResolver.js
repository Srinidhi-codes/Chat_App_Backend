const prisma = require('../../config/database');
const getAuthenticatedUser = require('../../helper/authHelper');

const channelsResolver = {
    Query: {
        async getUserChannels(_, __, { req }) {
            try {
                const { id } = getAuthenticatedUser(req);

                const channels = await prisma.channel.findMany({
                    where: {
                        OR: [{ adminId: id }, { members: { some: { id } } }],
                    },
                    include: {
                        members: true,
                        admin: true,
                        messages: {
                            include: {
                                sender: true,
                                recipient: true,
                            },
                        },
                    },
                });


                return { channels };
            } catch (error) {
                throw new Error(error.message);
            }
        },
        async searchChannel(_, { input }, { req }) {
            try {
                const { searchTerm } = input;
                const { id: userId } = getAuthenticatedUser(req);

                const channels = await prisma.channel.findMany({
                    where: {
                        name: {
                            contains: searchTerm.trim(),
                            mode: 'insensitive',
                        },
                        OR: [
                            { adminId: userId },
                            { members: { some: { id: userId } } }
                        ]
                    },
                    include: {
                        members: true,
                        admin: true,
                    }
                });

                return channels;
            } catch (error) {
                throw new Error(error.message);
            }
        },
    },

    Mutation: {
        async createChannel(_, { input }, { req }) {
            try {
                const { name, members } = input;
                const { id } = getAuthenticatedUser(req);

                // Validate admin
                const admin = await prisma.user.findUnique({
                    where: { id: id },
                });

                if (!admin) {
                    throw new Error('Admin user not found');
                }

                // Validate members
                const validMembers = await prisma.user.findMany({
                    where: {
                        id: { in: members },
                    },
                });

                if (validMembers.length !== members.length) {
                    throw new Error('Some members are not valid users');
                }

                // Create channel
                const newChannel = await prisma.channel.create({
                    data: {
                        name,
                        admin: {
                            connect: { id: id },
                        },
                        members: {
                            connect: members.map((id) => ({ id })),
                        },
                    },
                    include: {
                        admin: true,
                        members: true,
                    },
                });

                return { channel: newChannel };
            } catch (error) {
                throw new Error(error.message);
            }
        },
    },
};

module.exports = channelsResolver;
