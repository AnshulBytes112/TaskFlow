const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Example protected route - only authenticated users
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Access granted to authenticated user',
    user: req.user
  });
});

// Example admin-only route
router.get('/admin-only', verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Access granted to admin only',
    user: req.user
  });
});

// Example project manager or admin route
router.get('/manager-access', verifyToken, authorizeRoles('admin', 'project_manager'), (req, res) => {
  res.json({
    success: true,
    message: 'Access granted to project managers and admins',
    user: req.user
  });
});

module.exports = router;
