const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const modelAssociationUtil = require('../utils/modelAssociationUtil');
const socketManager = require('../utils/socketManager');

const models = initModels(sequelize);
const {
  Messages,
  Users
} = models;

// Verify required associations for Messages model
const messageAssociations = ['sender'];
const messageVerification = modelAssociationUtil.verifyRequiredAssociations('Messages', messageAssociations);

if (!messageVerification.valid) {
  console.error(`Missing required associations for Messages: ${messageVerification.missing.join(', ')}`);
}

const chatService = {
  /**
   * Send a direct message
   * @param {Object} messageData - The message data
   * @returns {Promise<Object>} - The created message
   */
  async sendMessage(messageData) {
    try {
      // Create the message
      const message = await Messages.create({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        contentType: messageData.contentType || 'text'
      });
      
      // Get the message with sender information
      const messageWithSender = await this.getMessageById(message.messageId);
      
      // Notify receiver
      socketManager.emitToUser(messageData.receiverId, 'message:new', messageWithSender);
      
      return messageWithSender;
    } catch (error) {
      throw new AppError(`Error sending message: ${error.message}`, 500);
    }
  },
  
  /**
   * Get messages between two users
   * @param {number} userId1 - First user ID
   * @param {number} userId2 - Second user ID
   * @param {Object} filters - Filters (limit, offset, etc.)
   * @returns {Promise<Array>} - Array of messages
   */
  async getConversation(userId1, userId2, filters = {}) {
    try {
      const { limit, offset } = filters;
      
      const messages = await Messages.findAll({
        where: {
          [Op.or]: [
            { senderId: userId1, receiverId: userId2 },
            { senderId: userId2, receiverId: userId1 }
          ]
        },
        include: [
          {
            model: Users,
            as: 'sender',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'role']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: limit || 50,
        offset: offset || 0
      });
      
      return messages;
    } catch (error) {
      throw new AppError(`Error retrieving conversation: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all conversations for a user
   * @param {number} userId - The user ID
   * @param {Object} filters - Filters (limit, offset, etc.)
   * @returns {Promise<Array>} - Array of conversation summaries
   */
  async getUserConversations(userId, filters = {}) {
    try {
      const { limit, offset } = filters;
      
      // Get distinct conversations
      const conversations = await Messages.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('senderId')), 'senderId'],
          [sequelize.fn('DISTINCT', sequelize.col('receiverId')), 'receiverId']
        ],
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      });
      
      // Get last message and user info for each conversation
      const conversationSummaries = await Promise.all(
        conversations.map(async conv => {
          const otherUserId = conv.senderId === userId ? conv.receiverId : conv.senderId;
          
          const [lastMessage, otherUser] = await Promise.all([
            Messages.findOne({
              where: {
                [Op.or]: [
                  { senderId: userId, receiverId: otherUserId },
                  { senderId: otherUserId, receiverId: userId }
                ]
              },
              order: [['createdAt', 'DESC']]
            }),
            Users.findByPk(otherUserId, {
              attributes: ['userId', 'firstName', 'lastName', 'email', 'role']
            })
          ]);
          
          return {
            otherUser,
            lastMessage,
            unreadCount: await Messages.count({
              where: {
                senderId: otherUserId,
                receiverId: userId,
                readAt: null
              }
            })
          };
        })
      );
      
      return conversationSummaries;
    } catch (error) {
      throw new AppError(`Error retrieving conversations: ${error.message}`, 500);
    }
  }
};

module.exports = chatService;
