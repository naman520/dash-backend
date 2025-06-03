const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

module.exports = {
  validateRegistration: async (req, res, next) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    next();
  },
checkSession: async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Unauthorized: No token provided' 
            });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if session is active in DB
        const activeSession = await userModel.getActiveSession(decoded.userId, token);
        if (!activeSession) {
            return res.status(401).json({ 
                success: false,
                error: 'Session expired or invalid' 
            });
        }

        // Attach user data to request
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Session check error:', err);
        return res.status(401).json({ 
            success: false,
            error: 'Invalid or expired token' 
        });
    }
},
};