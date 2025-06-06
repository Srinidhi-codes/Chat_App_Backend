const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const getAuthenticatedUser = require('../../helper/authHelper');

const userResolver = {
    Query: {
        async getUserInfo(_, { input }, { req }) {
            try {
                const { id } = getAuthenticatedUser(req);

                const user = await prisma.user.findUnique({
                    where: { id },
                });

                return { ...user };
            } catch (error) {
                // console.error(error);
                throw new Error(error.message);
            }
        }
    },

    Mutation: {
        async updateUserInfo(_, { input }, { req }) {
            try {
                const { id } = getAuthenticatedUser(req);
                const { firstName, lastName, color, image } = input;

                if (!firstName || !lastName || color === undefined) {
                    throw new Error('Firstname, Lastname & Color fields are required.');
                }
                // console.log("Updating user with id:", id);

                const updatedUser = await prisma.user.update({
                    where: { id },
                    data: {
                        firstName,
                        lastName,
                        image,
                        color,
                        profileSetup: true
                    },
                });

                return { ...updatedUser };
            } catch (error) {
                // console.error(error);
                throw new Error(error.message);
            }
        },
    },
};


module.exports = userResolver;
