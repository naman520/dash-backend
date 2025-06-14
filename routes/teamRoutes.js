const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { checkSession } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Routes accessible by all authenticated users
router.get('/accessible', checkSession, teamController.getAccessibleTeams);
router.get('/:id', checkSession, teamController.getTeamById);
router.get('/:id/members', checkSession, teamController.getTeamMembers);

// Admin-only routes
router.get('/', checkSession, requireRole('admin'), teamController.getAllTeams);
router.post('/', checkSession, requireRole('admin'), teamController.createTeam);
router.put('/:id', checkSession, requireRole('admin'), teamController.updateTeam);
router.delete('/:id', checkSession, requireRole('admin'), teamController.deleteTeam);
router.get('/:id/users', checkSession, requireRole('admin'), teamController.getUsersByTeam);

module.exports = router;