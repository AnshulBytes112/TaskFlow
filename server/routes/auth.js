const express = require('express');
const router = express.Router();
const { signup, login, refreshToken, logout } = require('../controllers/authController');

router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/logout
router.post('/logout', logout);

module.exports = router;
