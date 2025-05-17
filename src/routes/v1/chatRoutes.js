const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Chat room management
router.post('/', chatController.createChatRoom);
router.get('/', chatController.getUserChatRooms);
router.get('/:id', chatController.getChatRoomById);
router.patch('/:id', chatController.updateChatRoom);
router.delete('/:id', chatController.deleteChatRoom);

// Chat participants management
router.post('/:id/users', chatController.addUsersToChat);
router.delete('/:id/users', chatController.removeUsersFromChat);

// Chat messages
router.get('/:id/messages', chatController.getChatMessages);
router.post('/:id/messages', chatController.sendChatMessage);
router.delete('/:id/messages/:messageId', chatController.deleteChatMessage);

module.exports = router;
