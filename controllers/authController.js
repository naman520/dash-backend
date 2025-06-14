const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

require('dotenv').config();

module.exports = {
register: async (req, res) => {
    try {
        const { username, email, password, role = 'user', teamId } = req.body;

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

        // Validate team assignment
        let finalTeamId = teamId;
        if (role === 'admin') {
            finalTeamId = 0; // Force admin to team 0
        } else if (!teamId || teamId === 0) {
            finalTeamId = 1; // Default users to team 1
        }

        // Validate that the team exists (except for team 0)
        if (finalTeamId !== 0) {
            const team = await userModel.getTeamById(finalTeamId);
            if (!team) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid team specified'
                });
            }
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
            req.user.userId,
            finalTeamId
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                team_id: user.team_id
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
      { userId: user.id, role: user.role, teamId: user.team_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    try {
      await userModel.createSession(user.id, token);
    } catch (sessionErr) {
      console.error('Session creation failed:', sessionErr);
    }

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600000, 
    });

    const { password_hash, ...userData } = user;
    res.json({
      success: true,
      message: 'Login successful',
      role: user.role,
      teamId: user.team_id,
      teamName: user.team_name,
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

updateUser: async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, team_id } = req.body;
    
    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    const updateData = {
      username,
      email,
      newRole: role,
      teamId: team_id
    };

    const updatedUser = await userModel.updateUser(id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully"
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to update user",
    });
  }
},

  // Get current user info with team details
  getCurrentUser: async (req, res) => {
    try {
      const user = await userModel.findUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const { password_hash, ...userData } = user;
      res.json({
        success: true,
        data: userData
      });
    } catch (err) {
      console.error('Get current user error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user data'
      });
    }
  }
};