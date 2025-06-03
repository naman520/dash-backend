const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

require('dotenv').config();

module.exports = {
register: async (req, res) => {
    try {
        const { username, email, password, role = 'user' } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username, email and password are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                error: 'Only admins can register new users' 
            });
        }

        const exists = await userModel.userExists(username, email);
        if (exists) {
            return res.status(400).json({ 
                success: false,
                error: 'User already exists' 
            });
        }
      
        const user = await userModel.createUser(
            username, 
            email, 
            password, 
            role,
            req.user.userId 
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message || 'Internal server error' 
        });
    }
},

login: async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password required' 
      });
    }

    const user = await userModel.findUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    try {
      await userModel.createSession(user.id, token);
    } catch (sessionErr) {
      console.error('Session creation failed:', sessionErr);
    }

    res.cookie('token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
      maxAge: 3600000, 
    });

    const { password_hash, ...userData } = user;
    res.json({
      success: true,
      message: 'Login successful',
      data: userData,
      token: token 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
},

logout: async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({ 
        success: false,
        error: 'No active session' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    try {
      await userModel.endSession(userId, token);
    } catch (sessionErr) {
      console.error('Session termination failed:', sessionErr);
    }

    res.clearCookie('token');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
},

getAllUsers: async (req, res) => {
    try {
      const users = await userModel.getAllUsers();
      res.json({
        success: true,
        data: users,
      });
    } catch (err) {
      console.error('Get all users error:', err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
      });
    }
  },
};