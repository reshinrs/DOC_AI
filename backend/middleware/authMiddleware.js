const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes by verifying a JWT.
 * It checks for a 'Bearer' token in the Authorization header,
 * verifies it, and attaches the authenticated user object
 * (excluding the password) to the request (`req.user`).
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user by the ID from the token payload and attach to the request
            // Exclude the password field for security
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Proceed to the next middleware or route handler
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

/**
 * Middleware to restrict access to Admins only.
 * This should be used *after* the `protect` middleware, as it relies
 * on `req.user` being set.
 *
 * @param {object} req - The Express request object, with `req.user` attached.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
const adminOnly = (req, res, next) => {
    // Check if the user is authenticated and has the 'Admin' role
    if (req.user && req.user.role === 'Admin') {
        next(); // User is an admin, proceed
    } else {
        // User is not an admin, send a forbidden error
        res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
};

module.exports = { protect, adminOnly };