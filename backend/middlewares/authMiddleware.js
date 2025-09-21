const jwt = require('jsonwebtoken');

// This middleware function verifies the JWT token from the request header.
const authMiddleware = (req, res, next) => {
    // Get token from the 'x-auth-token' header
    const token = req.header('x-auth-token');

    // Check if no token is provided
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add the decoded member payload (which contains the ID) to the request object
        req.member = decoded.member;
        
        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

module.exports = authMiddleware;
