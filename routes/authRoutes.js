/* const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, checkSession } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const verifyToken = require('../middlewares/verifyToken');

// Public routes
router.post('/login', authController.login);
router.post('/logout', checkSession, authController.logout); 

// Registration route - temporarily open for initial setup
/* router.post('/register', validateRegistration, authController.register); */

/* router.post('/register', checkSession, requireRole('admin'), validateRegistration, authController.register);
router.get('/getAllUsers', checkSession, requireRole('admin'), authController.getAllUsers);
router.get('/me', verifyToken, (req, res) => {
    res.json({user : req.user})
})

module.exports = router; */ 

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, checkSession } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const verifyToken = require('../middlewares/verifyToken');

// Public routes
router.post('/login', authController.login);
router.post('/logout', checkSession, authController.logout); 

// Registration route - admin only with team support
router.post('/register', checkSession, requireRole('admin'), validateRegistration, authController.register);

// User management routes
router.get('/getAllUsers', checkSession, requireRole('admin'), authController.getAllUsers);
router.put('/updateUser/:id', checkSession, requireRole('admin'), authController.updateUser);

// Get current user with team info
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;