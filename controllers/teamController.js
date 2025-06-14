const userModel = require('../models/userModel');

module.exports = {
  // Get all teams (admin only)
  getAllTeams: async (req, res) => {
    try {
      const teams = await userModel.getAllTeams();
      res.json({
        success: true,
        data: teams
      });
    } catch (err) {
      console.error('Get all teams error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teams'
      });
    }
  },

  // Get accessible teams (based on user role)
  getAccessibleTeams: async (req, res) => {
    try {
      const teams = await userModel.getAccessibleTeams(req.user.userId);
      res.json({
        success: true,
        data: teams
      });
    } catch (err) {
      console.error('Get accessible teams error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teams'
      });
    }
  },

  // Get team by ID
  getTeamById: async (req, res) => {
    try {
      const { id } = req.params;
      const team = await userModel.getTeamById(id);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      // Check if user has access to this team
      if (req.user.role !== 'admin') {
        const user = await userModel.findUserById(req.user.userId);
        if (user.team_id !== parseInt(id)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied to this team'
          });
        }
      }

      res.json({
        success: true,
        data: team
      });
    } catch (err) {
      console.error('Get team error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch team'
      });
    }
  },

  // Get team members
  getTeamMembers: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user has access to this team
      if (req.user.role !== 'admin') {
        const user = await userModel.findUserById(req.user.userId);
        if (user.team_id !== parseInt(id)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied to this team'
          });
        }
      }

      const members = await userModel.getTeamMembers(id);
      res.json({
        success: true,
        data: members
      });
    } catch (err) {
      console.error('Get team members error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch team members'
      });
    }
  },

  // Create new team (admin only)
  createTeam: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Team name is required'
        });
      }

      const team = await userModel.createTeam(name, description);
      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: team
      });
    } catch (err) {
      console.error('Create team error:', err);
      if (err.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          error: 'Team name already exists'
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to create team'
      });
    }
  },

  // Update team (admin only)
  updateTeam: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Team name is required'
        });
      }

      const team = await userModel.updateTeam(id, name, description);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: team
      });
    } catch (err) {
      console.error('Update team error:', err);
      if (err.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          error: 'Team name already exists'
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to update team'
      });
    }
  },

  // Delete team (admin only)
  deleteTeam: async (req, res) => {
    try {
      const { id } = req.params;

      if (parseInt(id) === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete admin team'
        });
      }

      const deletedTeam = await userModel.deleteTeam(id);
      
      if (!deletedTeam) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      res.json({
        success: true,
        message: 'Team deleted successfully. Members moved to default team.'
      });
    } catch (err) {
      console.error('Delete team error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete team'
      });
    }
  },

  // Get users by team (admin only)
  getUsersByTeam: async (req, res) => {
    try {
      const { id } = req.params;
      const users = await userModel.getUsersByTeam(id);
      
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
  }
};