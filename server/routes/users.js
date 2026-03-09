const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getAllUsers,
  changeUserRole
} = require('../controllers/userController');

// GET /api/users — get all users [admin only]
router.get('/', verifyToken, authorizeRoles('admin'), getAllUsers);

// PATCH /api/users/:id/role — change user's global role [admin only]
router.patch('/:id/role', verifyToken, authorizeRoles('admin'), changeUserRole);

module.exports = router;
