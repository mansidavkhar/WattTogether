const jwt = require('jsonwebtoken');

// Verify JWT from either 'x-auth-token' or 'Authorization: Bearer <token>'
const authMiddleware = (req, res, next) => {
    let token = req.header('x-auth-token');
    if (!token && req.headers.authorization) {
        const m = req.headers.authorization.match(/^Bearer\s+(.*)$/i);
        if (m) token = m[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.member = decoded.member;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

module.exports = authMiddleware;
