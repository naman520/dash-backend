const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const adminOnly = require('../middlewares/adminOnly');

router.get('/validate-dashboard-access', verifyToken, adminOnly, (req, res) => {
  res.json({ success: true });
});

module.exports = router;