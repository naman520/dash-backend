const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userModel = require('../models/userModel');
const { checkSession } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.get('/users', checkSession, requireRole('admin'), authController.getAllUsers);

// Update user role
router.patch('/users/:id/role', checkSession, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'user', 'moderator'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid role specified' 
      });
    }
    
    const updatedUser = await userModel.updateUserRole(id, role);
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // If user is being made admin, move them to team 0
    if (role === 'admin') {
      await userModel.updateUserTeam(id, 0);
    }
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedUser
    });
    
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update user team
router.patch('/users/:id/team', checkSession, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { teamId } = req.body;
    
    // Validate team exists
    if (teamId !== 0) {
      const team = await userModel.getTeamById(teamId);
      if (!team) {
        return res.status(400).json({
          success: false,
          error: 'Invalid team specified'
        });
      }
    }

    // Check if user is admin - admins should stay in team 0
    const user = await userModel.findUserById(id);
    if (user.role === 'admin' && teamId !== 0) {
      return res.status(400).json({
        success: false,
        error: 'Admin users must remain in team 0'
      });
    }
    
    const updatedUser = await userModel.updateUserTeam(id, teamId);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Team updated successfully',
      data: updatedUser
    });
    
  } catch (err) {
    console.error('Update team error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete user
router.delete('/users/:id', checkSession, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if trying to delete themselves
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Admins cannot delete themselves'
      });
    }
    
    // Check if the user being deleted is an admin
    const userToDelete = await userModel.findUserById(id);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (userToDelete.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete admin users'
      });
    }
    
    await userModel.deleteUser(id, req.user.userId);
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to delete user'
    });
  }
});

// Get users by team
router.get('/teams/:teamId/users', checkSession, requireRole('admin'), async (req, res) => {
  try {
    const { teamId } = req.params;
    const users = await userModel.getUsersByTeam(teamId);
    
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Get users by team error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team users'
    });
  }
});

// Get current user info
router.get('/me', checkSession, authController.getCurrentUser);

module.exports = router;