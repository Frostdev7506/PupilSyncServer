const chatService = require('../services/chatService');
const AppError = require('../utils/errors/AppError');
const { validateChat, validateChatMessage } = require('../utils/validators/chatValidator');
const paramParser = require('../utils/paramParser');

const chatController = {
  /**
   * Create a new chat room
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createChatRoom(req, res, next) {
    try {
      // Validate request body
      const { error } = validateChat(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current user as the creator
      const chatData = {
        ...req.body,
        createdBy: req.user.userId
      };
      
      const chat = await chatService.createChatRoom(chatData);
      
      res.status(201).json({
        status: 'success',
        data: {
          chat
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a chat room by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getChatRoomById(req, res, next) {
    try {
      const { id } = req.params;
      
      const chat = await chatService.getChatRoomById(id);
      
      // Check if user is authorized to view this chat
      if (!await chatService.isUserInChat(chat.chatId, req.user.userId)) {
        return next(new AppError('You are not authorized to view this chat', 403));
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          chat
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all chat rooms for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUserChatRooms(req, res, next) {
    try {
      const { type, entityId } = req.query;
      
      const filters = {
        type,
        entityId: paramParser.parseInteger(entityId)
      };
      
      const chats = await chatService.getUserChatRooms(req.user.userId, filters);
      
      res.status(200).json({
        status: 'success',
        results: chats.length,
        data: {
          chats
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a chat room
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateChatRoom(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateChat(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to update this chat
      const chat = await chatService.getChatRoomById(id);
      
      if (req.user.role !== 'admin' && chat.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to update this chat', 403));
      }
      
      const updatedChat = await chatService.updateChatRoom(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          chat: updatedChat
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a chat room
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteChatRoom(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if user is authorized to delete this chat
      const chat = await chatService.getChatRoomById(id);
      
      if (req.user.role !== 'admin' && chat.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to delete this chat', 403));
      }
      
      await chatService.deleteChatRoom(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add users to a chat room
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async addUsersToChat(req, res, next) {
    try {
      const { id } = req.params;
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
        return next(new AppError('User IDs must be an array', 400));
      }
      
      // Check if user is authorized to add users to this chat
      const chat = await chatService.getChatRoomById(id);
      
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          chat.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to add users to this chat', 403));
      }
      
      const updatedChat = await chatService.addUsersToChat(id, userIds);
      
      res.status(200).json({
        status: 'success',
        data: {
          chat: updatedChat
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove users from a chat room
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async removeUsersFromChat(req, res, next) {
    try {
      const { id } = req.params;
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
        return next(new AppError('User IDs must be an array', 400));
      }
      
      // Check if user is authorized to remove users from this chat
      const chat = await chatService.getChatRoomById(id);
      
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          chat.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to remove users from this chat', 403));
      }
      
      const updatedChat = await chatService.removeUsersFromChat(id, userIds);
      
      res.status(200).json({
        status: 'success',
        data: {
          chat: updatedChat
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get chat messages
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getChatMessages(req, res, next) {
    try {
      const { id } = req.params;
      const { limit, offset, startDate, endDate } = req.query;
      
      // Check if user is authorized to view this chat
      const chat = await chatService.getChatRoomById(id);
      
      if (!await chatService.isUserInChat(chat.chatId, req.user.userId)) {
        return next(new AppError('You are not authorized to view this chat', 403));
      }
      
      const filters = {
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate),
        ...paramParser.parsePagination(req.query)
      };
      
      const messages = await chatService.getChatMessages(id, filters);
      
      res.status(200).json({
        status: 'success',
        results: messages.length,
        data: {
          messages
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Send a chat message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async sendChatMessage(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateChatMessage(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to send messages to this chat
      if (!await chatService.isUserInChat(id, req.user.userId)) {
        return next(new AppError('You are not authorized to send messages to this chat', 403));
      }
      
      // Set the current user as the sender
      const messageData = {
        ...req.body,
        chatId: parseInt(id),
        senderId: req.user.userId
      };
      
      const message = await chatService.sendChatMessage(messageData);
      
      res.status(201).json({
        status: 'success',
        data: {
          message
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a chat message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteChatMessage(req, res, next) {
    try {
      const { id, messageId } = req.params;
      
      // Check if user is authorized to delete this message
      const message = await chatService.getChatMessageById(messageId);
      
      if (!message) {
        return next(new AppError('Message not found', 404));
      }
      
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          message.senderId !== req.user.userId) {
        return next(new AppError('You are not authorized to delete this message', 403));
      }
      
      await chatService.deleteChatMessage(messageId);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = chatController;
