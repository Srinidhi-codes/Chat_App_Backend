const jwt = require('jsonwebtoken');

const getAuthenticatedUser = (req) => {
    try {
        const token = req.cookies?.token;
        if (!token) throw new Error("Authentication token not found");

        const payload = jwt.verify(token, process.env.SECRET_KEY);
        return payload;
    } catch (err) {
        console.error("Auth error:", err.message);
        throw new Error("Not authenticated");
    }
};

module.exports = getAuthenticatedUser;
