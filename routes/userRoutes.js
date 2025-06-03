const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userModel = require('../models/userModel');
const { checkSession } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.get('/users', checkSession, requireRole('admin'), authController.getAllUsers);

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

module.exports = router;