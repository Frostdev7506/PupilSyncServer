const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Chat room management
router.post('/', restrictTo('student', 'teacher', 'admin'), chatController.createChatRoom);
router.get('/', restrictTo('student', 'teacher', 'admin'), chatController.getUserChatRooms);
router.get('/:id', restrictTo('student', 'teacher', 'admin'), chatController.getChatRoomById);
router.patch('/:id', restrictTo('teacher', 'admin'), chatController.updateChatRoom);
router.delete('/:id', restrictTo('teacher', 'admin'), chatController.deleteChatRoom);

// Chat participants management
router.post('/:id/users', restrictTo('teacher', 'admin'), chatController.addUsersToChat);
router.delete('/:id/users', restrictTo('teacher', 'admin'), chatController.removeUsersFromChat);

// Chat messages
router.get('/:id/messages', restrictTo('student', 'teacher', 'admin'), chatController.getChatMessages);
router.post('/:id/messages', restrictTo('student', 'teacher', 'admin'), chatController.sendChatMessage);
router.delete('/:id/messages/:messageId', restrictTo('student', 'teacher', 'admin'), chatController.deleteChatMessage);

module.exports = router;
