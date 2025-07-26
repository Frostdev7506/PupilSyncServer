const chatService = require('../services/chatService');
const AppError = require('../utils/errors/AppError');
const {
  validateCreateRoom,
  validateUpdateRoom,
  validateSendMessage,
  validateAddUser
} = require('../utils/validators/chatValidator');
const paramParser = require('../utils/paramParser');

const chatController = {
  /**
   * Creates a new chat room (either 1-to-1 or group).
   * Route: POST /api/chats
   */
  async createChatRoom(req, res, next) {
    try {
      const { error } = validateCreateRoom(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const roomData = { ...req.body, creatorId: req.user.userId };
      const chatRoom = await chatService.createChatRoom(roomData);
      
      res.status(201).json({
        status: 'success',
        data: { room: chatRoom },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Gets all chat rooms for the currently authenticated user.
   * Route: GET /api/chats
   */
  async getUserChatRooms(req, res, next) {
    try {
      const chatRooms = await chatService.getUserChatRooms(req.user.userId);
      
      res.status(200).json({
        status: 'success',
        results: chatRooms.length,
        data: { rooms: chatRooms },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Gets the full details of a single chat room.
   * The service layer handles the authorization check.
   * Route: GET /api/chats/:chatId
   */
  async getChatRoomDetails(req, res, next) {
    try {
      const { chatId } = req.params;
      const room = await chatService.getChatRoomDetails(parseInt(chatId), req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Updates a group chat's name or settings.
   * Route: PATCH /api/chats/:chatId
   */
  async updateChatRoom(req, res, next) {
    try {
      const { chatId } = req.params;
      const { error } = validateUpdateRoom(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const updatedRoom = await chatService.updateChatRoom(
        parseInt(chatId),
        req.body,
        req.user.userId
      );

      res.status(200).json({
        status: 'success',
        data: { room: updatedRoom },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deletes a group chat. The service ensures the user is an admin.
   * Route: DELETE /api/chats/:chatId
   */
  async deleteChatRoom(req, res, next) {
    try {
      const { chatId } = req.params;
      await chatService.deleteChatRoom(parseInt(chatId), req.user.userId);
      
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Adds a user to a group chat. The service ensures the requester is an admin.
   * Route: POST /api/chats/:chatId/participants
   */
  async addUserToGroup(req, res, next) {
    try {
      const { chatId } = req.params;
      const { error } = validateAddUser(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const { userIdToAdd } = req.body;
      const participant = await chatService.addUserToGroup(
        parseInt(chatId),
        userIdToAdd,
        req.user.userId
      );

      res.status(201).json({
        status: 'success',
        message: 'User added to group.',
        data: { participant },
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Removes a user from a group chat. The service ensures the requester is an admin.
   * Route: DELETE /api/chats/:chatId/participants/:userIdToRemove
   */
  async removeUserFromGroup(req, res, next) {
    try {
      const { chatId, userIdToRemove } = req.params;
      await chatService.removeUserFromGroup(
        parseInt(chatId),
        parseInt(userIdToRemove),
        req.user.userId
      );

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Gets all messages for a specific chat room. The service ensures the user is a participant.
   * Route: GET /api/chats/:chatId/messages
   */
  async getChatMessages(req, res, next) {
    try {
      const { chatId } = req.params;
      const pagination = paramParser.parsePagination(req.query);

      const messages = await chatService.getMessagesForRoom(
        parseInt(chatId),
        req.user.userId,
        pagination
      );

      res.status(200).json({
        status: 'success',
        results: messages.length,
        data: { messages },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Sends a message to a specific chat room. The service ensures the user is a participant.
   * Route: POST /api/chats/:chatId/messages
   */
  async sendChatMessage(req, res, next) {
    try {
      const { chatId } = req.params;
      const { error } = validateSendMessage(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const messageData = {
        chatId: parseInt(chatId),
        senderId: req.user.userId,
        content: req.body.content,
      };

      const message = await chatService.sendMessage(messageData);

      res.status(201).json({
        status: 'success',
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deletes a single chat message. The service ensures the user is the sender or an admin.
   * Route: DELETE /api/chats/:chatId/messages/:messageId
   */
  async deleteChatMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      await chatService.deleteChatMessage(parseInt(messageId), req.user.userId);
      
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = chatController;