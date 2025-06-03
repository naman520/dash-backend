const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, checkSession } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Public routes
router.post('/login', authController.login);
router.post('/logout', checkSession, authController.logout); 

// Registration route - temporarily open for initial setup
/* router.post('/register', validateRegistration, authController.register); */

router.post('/register', checkSession, requireRole('admin'), validateRegistration, authController.register);
router.post('/register', checkSession, requireRole('admin'), validateRegistration, authController.register);
router.get('/getAllUsers', checkSession, requireRole('admin'), authController.getAllUsers);

module.exports = router;