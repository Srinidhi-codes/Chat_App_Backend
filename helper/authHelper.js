const jwt = require('jsonwebtoken');

const getAuthenticatedUser = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new Error("Authorization header missing");

        const token = authHeader.replace("Bearer ", "");
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        return payload;
    } catch (err) {
        console.error("Auth error:", err.message);
        throw new Error("Not authenticated");
    }
};

module.exports = getAuthenticatedUser;
