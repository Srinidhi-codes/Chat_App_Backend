const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');

const authResolver = {
    Query: {
        async getAuthInfo(_, { input }, { req }) {
            try {

            } catch (error) {

            }
        }
    },

    Mutation: {
        async signUp(_, { input }, { res }) {
            try {
                const { email, password } = input;

                if (!email || !password) {
                    throw new Error("Email and password are required.");
                }

                // Check for existing user
                const existingUser = await prisma.user.findUnique({
                    where: { email },
                });

                if (existingUser) {
                    throw new Error("User with this email already exists.");
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                const newUser = await prisma.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                    },
                });

                // Generate token
                const token = jwt.sign({ id: newUser.id }, process.env.SECRET_KEY, {
                    expiresIn: "7d",
                });

                res.cookie("token", token, {
                    secure: true,
                    sameSite: "None",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                });

                return {
                    id: newUser.id,
                    email: newUser.email,
                    profileSetup: newUser.profileSetup,
                    token
                };

            } catch (error) {
                throw new Error(error.message);
            }
        },
        async login(_, { input }, { res }) {
            try {
                const { email, password } = input;

                if (!email || !password) {
                    throw new Error("Email and password are required.");
                }

                const existingUser = await prisma.user.findUnique({
                    where: { email },
                });

                if (!existingUser) {
                    throw new Error("User with this email does not exist.");
                }

                const isPasswordValid = await bcrypt.compare(password, existingUser.password);

                if (!isPasswordValid) {
                    throw new Error("Incorrect credentials.");
                }

                const token = jwt.sign({ id: existingUser.id }, process.env.SECRET_KEY, {
                    expiresIn: "7d",
                });

                // Set token in cookie
                res.cookie("token", token, {
                    secure: true,
                    sameSite: "None",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                });

                return {
                    ...existingUser,
                    token,
                };
            } catch (error) {
                throw new Error(error.message);
            }
        },
        async logout(_, { input }, { res }) {
            try {
                res.cookie("token", "", {
                    secure: true,
                    sameSite: "None",
                    maxAge: 0
                });
                return { message: "Logout successful" };
            } catch (error) {
                throw new Error(error.message);
            }
        },
    },
};

module.exports = authResolver;
