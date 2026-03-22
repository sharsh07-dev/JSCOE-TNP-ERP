const jwt = require('jsonwebtoken');
const { getDb } = require('../config/firebase');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const db = getDb();
        const userDoc = await db.collection('users').doc(decoded.uid).get();

        if (!userDoc.exists) return res.status(401).json({ error: 'User not found' });

        const userData = userDoc.data();
        if (!userData.isActive) return res.status(403).json({ error: 'Account deactivated' });

        req.user = { uid: decoded.uid, ...userData };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
