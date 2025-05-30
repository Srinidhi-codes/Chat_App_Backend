const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendMail({ to, subject, html }) {
    return transporter.sendMail({
        from: `"Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
}

module.exports = sendMail;
