const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken, isEmailVerified, isSuperAdmin, isAdmin } = require('../middleware/auth');

// All message routes require authentication and verified email
router.use(authenticateToken);
router.use(isEmailVerified);

// Message endpoints
router.post('/send', messageController.sendMessage);
router.get('/', messageController.getMessages);
router.patch('/:messageId/read', messageController.markAsRead);

// Super Admin only endpoints
router.delete('/:messageId', isSuperAdmin, messageController.deleteMessage);

module.exports = router;
