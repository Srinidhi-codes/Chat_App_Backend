const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const crypto = require('crypto');
const sendMail = require('../../helper/mailer');

const authResolver = {
    Query: {
        async getAuthInfo(_, { input }, { req }) {
            // Reserved for future use
        },
    },

    Mutation: {
        async initSignUp(_, { input }) {
            const { email, password } = input;
            if (!email || !password) throw new Error("Email and password are required.");

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) throw new Error("User with this email already exists.");

            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const otpExpiry = BigInt(Date.now() + 10 * 60 * 1000);

            await prisma.user.create({
                data: {
                    email,
                    password: await bcrypt.hash(password, 10),
                    otp,
                    otpExpiry,
                },
            });

            await sendMail({
                to: email,
                subject: "Connectify Email Verification Code",
                text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; text-align: start; color: #333;">
                    <img src="https://res.cloudinary.com/dvoi1wvxl/image/upload/v1748461099/beefv9l7xgzern20o0oh.png" alt="Connectify Logo" width="120" style="margin-bottom: 20px;" />
              
                    <h2 style="margin: 0 0 10px;">Dear ${email},</h2>
                    
                    <p style="font-size: 16px; margin: 0 0 16px;">
                      <strong>${otp}</strong> is the OTP to verify your Connectify account.  OTPs are <strong>confidential</strong>. Please enter this OTP to continue your journey with Connectify.
                    </p>
              
                    <p style="font-size: 16px; margin: 0 0 24px;">
                      This OTP will expire in <strong>10 minutes</strong>.
                    </p>
              
                    <p style="font-size: 14px; color: #555;">Sincerely,<br/>Team Connectify</p>
              
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
              
                    <p style="font-size: 12px; color: #999;">This is an auto-generated email. Please do not reply.</p>
                  </div>
                `,
            });
            return { message: `OTP sent to your ${email}.` };
        },

        async initLogin(_, { input }) {
            const { email, password } = input;
            if (!email || !password) throw new Error("Email and password are required.");

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) throw new Error("User not found.");

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) throw new Error("Invalid credentials.");

            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const otpExpiry = BigInt(Date.now() + 10 * 60 * 1000);

            await prisma.user.update({
                where: { email },
                data: {
                    otp,
                    otpExpiry,
                },
            });

            await sendMail({
                to: email,
                subject: "Connectify Email Verification Code",
                text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; text-align: start; color: #333;">
                    <img src="https://res.cloudinary.com/dvoi1wvxl/image/upload/v1748461099/beefv9l7xgzern20o0oh.png" alt="Connectify Logo" width="120" style="margin-bottom: 20px;" />
              
                    <h2 style="margin: 0 0 10px;">Dear ${email},</h2>
                    
                    <p style="font-size: 16px; margin: 0 0 16px;">
                      <strong>${otp}</strong> is the OTP to verify your Connectify account.  OTPs are <strong>confidential</strong>. Please enter this OTP to continue your journey with Connectify.
                    </p>
              
                    <p style="font-size: 16px; margin: 0 0 24px;">
                      This OTP will expire in <strong>10 minutes</strong>.
                    </p>
              
                    <p style="font-size: 14px; color: #555;">Sincerely,<br/>Team Connectify</p>
              
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
              
                    <p style="font-size: 12px; color: #999;">This is an auto-generated email. Please do not reply.</p>
                  </div>
                `,
            });
            return { message: `OTP sent to your ${email}.` };
        },

        async verifyOtp(_, { email, otp }) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) throw new Error("User not found.");
            if (!user.otp || !user.otpExpiry) throw new Error("OTP not requested.");

            if (user.otp !== otp || BigInt(Date.now()) > user.otpExpiry) {
                throw new Error("Invalid or expired OTP.");
            }

            await prisma.user.update({
                where: { email },
                data: {
                    otp: null,
                    otpExpiry: null,
                },
            });

            const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: "7d" });

            return {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                color: user.color,
                profileSetup: user.profileSetup,
                token,
            };
        },

        async resendOtp(_, { input }) {
            const { email } = input;
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const otpExpiry = BigInt(Date.now() + 10 * 60 * 1000);

            await prisma.user.update({
                where: { email },
                data: {
                    otp,
                    otpExpiry,
                },
            });
            await sendMail({
                to: email,
                subject: "Connectify Email Verification Code",
                text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; text-align: start; color: #333;">
                    <img src="https://res.cloudinary.com/dvoi1wvxl/image/upload/v1748461099/beefv9l7xgzern20o0oh.png" alt="Connectify Logo" width="120" style="margin-bottom: 20px;" />
              
                    <h2 style="margin: 0 0 10px;">Dear ${email},</h2>
                    
                    <p style="font-size: 16px; margin: 0 0 16px;">
                      <strong>${otp}</strong> is the OTP to verify your Connectify account.  OTPs are <strong>confidential</strong>. Please enter this OTP to continue your journey with Connectify.
                    </p>
              
                    <p style="font-size: 16px; margin: 0 0 24px;">
                      This OTP will expire in <strong>10 minutes</strong>.
                    </p>
              
                    <p style="font-size: 14px; color: #555;">Sincerely,<br/>Team Connectify</p>
              
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
              
                    <p style="font-size: 12px; color: #999;">This is an auto-generated email. Please do not reply.</p>
                  </div>
                `,
            });

            return { message: `OTP sent to your ${email}.` };
        },

        async logout() {
            return { message: "Logout successful" };
        },

        async forgotPassword(_, { email }) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) throw new Error("User not found");

            const token = crypto.randomBytes(32).toString("hex");

            await prisma.user.update({
                where: { email },
                data: {
                    resetToken: token,
                    resetTokenExpiry: BigInt(Date.now() + 3600000),
                },
            });

            const resetUrl = `${process.env.FRONTEND_URL} /reset-password/${token} `;

            await sendMail({
                to: email,
                subject: "Reset your password",
                html: `< p > Click <a a href = "${resetUrl}" > here</a > to reset your password.This link expires in 1 hour.</p > `,
            });

            return { message: "Reset link sent to your email" };
        },

        async resetPassword(_, { token, newPassword }) {
            const user = await prisma.user.findFirst({
                where: {
                    resetToken: token,
                    resetTokenExpiry: {
                        gte: BigInt(Date.now()),
                    },
                },
            });

            if (!user) throw new Error("Invalid or expired token");

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null,
                },
            });

            return { message: "Password reset successful" };
        },
    },
};

module.exports = authResolver;
