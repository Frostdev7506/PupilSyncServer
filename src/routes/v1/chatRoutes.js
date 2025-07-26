// src/routes/v1/chatRoutes.js

const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatController');
const { protect, restrictTo } = require('../../middlewares/auth'); // Correct path to your auth middleware

// All routes below this line are protected and require a valid authenticated user.
router.use(protect);

// --- Chat Room Management ---

// Any authenticated user can create a chat room or list their own rooms.
router.route('/')
  .post(restrictTo('student', 'teacher', 'admin'), chatController.createChatRoom)
  .get(restrictTo('student', 'teacher', 'admin'), chatController.getUserChatRooms);

// Any participant can get room details. Only admins/teachers can update or delete.
router.route('/:id')
  .get(restrictTo('student', 'teacher', 'admin'), chatController.getChatRoomDetails)
  .patch(restrictTo('teacher', 'admin'), chatController.updateChatRoom)
  .delete(restrictTo('teacher', 'admin'), chatController.deleteChatRoom);

// --- Participant Management ---

// Only admins/teachers can add users to a group.
router.route('/:id/participants')
  .post(restrictTo('teacher', 'admin'), chatController.addUserToGroup);

// Only admins/teachers can remove users from a group.
router.route('/:id/participants/:userIdToRemove')
  .delete(restrictTo('teacher', 'admin'), chatController.removeUserFromGroup);

// --- Message Management ---

// Any participant can get messages or send a new one.
router.route('/:id/messages')
  .get(restrictTo('student', 'teacher', 'admin'), chatController.getChatMessages)
  .post(restrictTo('student', 'teacher', 'admin'), chatController.sendChatMessage);

// Any participant can delete their own message. Admins/teachers can delete any message.
// The fine-grained logic (own message vs any message) is handled in the service/controller.
// The route just ensures a logged-in user of the correct role makes the request.
router.route('/:id/messages/:messageId')
  .delete(restrictTo('student', 'teacher', 'admin'), chatController.deleteChatMessage);

module.exports = router;