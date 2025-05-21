const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, isSuperAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', authController.registerUser);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticateToken, authController.logout);

// Super Admin only routes - user management
router.get('/users', authenticateToken, isSuperAdmin, (req, res) => {
  // This would be implemented in a user controller
  res.status(200).json({
    success: true,
    message: 'Super Admin access granted - User list would be displayed here'
  });
});

module.exports = router;
