const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const socketManager = require('../utils/socketManager'); // Assuming you have this for real-time updates

const models = initModels(sequelize);
const {
  ChatRooms,
  ChatParticipants,
  ChatMessages,
  Users
} = models;

const chatService = {
  /**
   * Finds an existing direct (1-to-1) chat room between two users.
   * This is a crucial helper to prevent creating duplicate rooms for the same two people.
   * @param {number} userId1 - ID of the first user.
   * @param {number} userId2 - ID of the second user.
   * @returns {Promise<Object|null>} - The existing chat room instance or null.
   */
  async _findDirectChat(userId1, userId2) {
    // This query finds a chat room that is NOT a group and has EXACTLY two participants
    // matching the two user IDs provided.
    const rooms = await ChatRooms.findAll({
      where: {
        isGroup: false
      },
      include: [{
        model: ChatParticipants,
        as: 'participants',
        attributes: ['userId'],
        where: {
          userId: { [Op.in]: [userId1, userId2] }
        }
      }],
      group: ['ChatRooms.chat_id'], // Use the actual column name from your model
      having: sequelize.literal(`count("participants"."user_id") = 2`)
    });
    return rooms.length > 0 ? rooms[0] : null;
  },

  /**
   * Creates a new chat room. Can be a group or a 1-to-1 chat.
   * For 1-to-1, it first checks if a chat already exists.
   * @param {Object} roomData - Data for creating the room.
   * @param {number} roomData.creatorId - The ID of the user creating the room.
   * @param {string} [roomData.name] - The name of the room (required for groups).
   * @param {string} [roomData.type='direct'] - The type of chat ('direct', 'course', etc.).
   * @param {boolean} roomData.isGroup - True if it's a group chat.
   * @param {number[]} roomData.participantIds - Array of OTHER user IDs to add.
   * @param {number} [roomData.entityId] - Optional ID to link room to a course, project, etc.
   * @returns {Promise<Object>} - The created or found chat room.
   */
  async createChatRoom({ creatorId, name, type = 'direct', isGroup, participantIds, entityId }) {
    if (!isGroup) {
      if (!participantIds || participantIds.length !== 1) {
        throw new AppError('A direct chat must have exactly one other participant.', 400);
      }
      // For a 1-to-1 chat, check if a room already exists to avoid duplicates
      const otherUserId = participantIds[0];
      const existingChat = await this._findDirectChat(creatorId, otherUserId);
      if (existingChat) {
        // If it exists, just return the details of that room.
        return this.getChatRoomDetails(existingChat.chatId, creatorId);
      }
    } else {
      if (!name) {
        throw new AppError('Group chats must have a name.', 400);
      }
    }

    const transaction = await sequelize.transaction();
    try {
      const room = await ChatRooms.create({
        name: isGroup ? name : 'Direct Message', // Use a default or null name for direct chats
        type,
        isGroup,
        entityId,
        createdBy: creatorId
      }, { transaction });

      // Combine creator with other participants, ensuring no duplicates
      const allParticipantIds = [...new Set([creatorId, ...participantIds])];
      const participants = allParticipantIds.map(userId => ({
        chatId: room.chatId,
        userId,
        isAdmin: userId === creatorId // Creator is admin by default
      }));

      await ChatParticipants.bulkCreate(participants, { transaction });

      await transaction.commit();

      const newRoomDetails = await this.getChatRoomDetails(room.chatId, creatorId);
      
      // Notify all OTHER participants that they've been added to a new room
      participantIds.forEach(userId => {
        socketManager.emitToUser(userId, 'chat:newRoom', newRoomDetails);
      });

      return newRoomDetails;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(`Error creating chat room: ${error.message}`, 500);
    }
  },

  /**
   * Sends a message to a specific chat room.
   * @param {Object} messageData - The message data.
   * @param {number} messageData.senderId - The sender's user ID.
   * @param {number} messageData.chatId - The ID of the chat room.
   * @param {string} messageData.content - The message content.
   * @returns {Promise<Object>} - The created message with sender details.
   */
  async sendMessage({ senderId, chatId, content }) {
    // Security check: Ensure the sender is a member of the room before allowing them to post.
    const participant = await ChatParticipants.findOne({
      where: { chatId, userId: senderId }
    });

    if (!participant) {
      throw new AppError('You are not a member of this chat room.', 403);
    }

    try {
      const message = await ChatMessages.create({
        chatId,
        senderId,
        content,
      });

      // Fetch the full message with sender details to broadcast via sockets
      const fullMessage = await ChatMessages.findByPk(message.messageId, {
        include: [{
            model: Users,
            as: 'sender',
            attributes: ['userId', 'firstName', 'lastName']
        }]
      });

      // Emit the message to all clients in the room via sockets
      socketManager.emitToRoom(`chat_${chatId}`, 'chat:newMessage', fullMessage);

      return fullMessage;
    } catch (error) {
      throw new AppError(`Error sending message: ${error.message}`, 500);
    }
  },
  
  /**
   * Retrieves all messages for a given chat room with pagination.
   * @param {number} chatId - The ID of the chat room.
   * @param {number} userId - The ID of the user requesting messages (for auth check).
   * @param {Object} [filters={}] - Pagination filters (limit, offset).
   * @returns {Promise<Array>} - An array of messages, sorted chronologically.
   */
  async getMessagesForRoom(chatId, userId, filters = {}) {
    // Security check: Ensure the user is a member of the room.
    const participant = await ChatParticipants.findOne({
      where: { chatId, userId }
    });

    if (!participant) {
      throw new AppError('You do not have access to this chat room.', 403);
    }
    
    try {
      const messages = await ChatMessages.findAll({
        where: { chatId },
        include: [{
          model: Users,
          as: 'sender',
          attributes: ['userId', 'firstName', 'lastName']
        }],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50,
        offset: filters.offset || 0
      });

      // Reverse the array to have the oldest messages first for correct display order
      return messages.reverse();
    } catch (error) {
      throw new AppError(`Error retrieving messages: ${error.message}`, 500);
    }
  },
  
  /**
   * Retrieves all chat rooms a user is a part of, with details for a conversation list.
   * @param {number} userId - The user's ID.
   * @returns {Promise<Array>} - An array of chat rooms with participants and the last message.
   */
  async getUserChatRooms(userId) {
    try {
      const rooms = await ChatRooms.findAll({
        include: [
          {
            model: ChatParticipants,
            as: 'participants',
            where: { userId }, // This is the key filter to get only rooms the user is in.
            attributes: [], // We don't need the participant details in the top-level result.
          },
          {
            model: ChatParticipants, // Include participants again to get ALL participants of the found rooms.
            as: 'participants',
            include: [{
              model: Users,
              as: 'user',
              attributes: ['userId', 'firstName', 'lastName']
            }]
          },
          {
            model: ChatMessages, // Subquery to get only the very last message for each room.
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']],
            include: [{ model: Users, as: 'sender', attributes: ['firstName'] }]
          }
        ],
        // Order the entire list of rooms by the most recent message.
        order: [[{ model: ChatMessages, as: 'messages' }, 'createdAt', 'DESC NULLS LAST']]
      });
      return rooms;
    } catch (error) {
      throw new AppError(`Error retrieving user chat rooms: ${error.message}`, 500);
    }
  },

  /**
   * Gets a single chat room's details, including all its participants.
   * @param {number} chatId - The ID of the chat room.
   * @param {number} userId - The user requesting (for auth check).
   * @returns {Promise<Object>} - The chat room object.
   */
  async getChatRoomDetails(chatId, userId) {
    // Security check
    const participant = await ChatParticipants.findOne({ where: { chatId, userId }});
    if (!participant) {
        throw new AppError('You do not have access to this chat room.', 403);
    }

    return ChatRooms.findByPk(chatId, {
        include: [{
            model: ChatParticipants,
            as: 'participants',
            include: [{
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName']
            }]
        }]
    });
  },

  /**
   * Adds a user to an existing group chat.
   * @param {number} chatId - The ID of the chat room.
   * @param {number} userIdToAdd - The ID of the user to add.
   * @param {number} requestedById - The ID of the user making the request (must be admin).
   * @returns {Promise<Object>} The new participant record.
   */
  async addUserToGroup(chatId, userIdToAdd, requestedById) {
      const room = await ChatRooms.findByPk(chatId);
      if (!room || !room.isGroup) {
          throw new AppError('Chat room not found or is not a group.', 404);
      }
      
      const requester = await ChatParticipants.findOne({ where: { chatId, userId: requestedById } });
      if (!requester || !requester.isAdmin) {
          throw new AppError('Only group admins can add new members.', 403);
      }

      const [newParticipant, created] = await ChatParticipants.findOrCreate({
          where: { chatId, userId: userIdToAdd },
          defaults: { chatId, userId: userIdToAdd, isAdmin: false }
      });

      if (created) {
          const roomDetails = await this.getChatRoomDetails(chatId, requestedById);
          socketManager.emitToUser(userIdToAdd, 'chat:addedToGroup', roomDetails);
          socketManager.emitToRoom(`chat_${chatId}`, 'chat:userJoined', { chatId, user: newParticipant });
      }

      return newParticipant;
  },


  /**
   * Updates a group chat's details (e.g., name).
   * @param {number} chatId - The ID of the chat room to update.
   * @param {Object} updateData - The data to update (e.g., { name }).
   * @param {number} requestedById - The user making the request (must be admin).
   * @returns {Promise<Object>} The updated chat room.
   */
  async updateChatRoom(chatId, updateData, requestedById) {
    await this._verifyGroupAdmin(chatId, requestedById);

    const room = await ChatRooms.findByPk(chatId);
    if (!room) throw new AppError('Chat room not found.', 404);
    if (!room.isGroup) throw new AppError('Only group chats can be updated.', 400);

    await room.update(updateData);
    
    const updatedRoomDetails = await this.getChatRoomDetails(chatId, requestedById);
    socketManager.emitToRoom(`chat_${chatId}`, 'chat:roomUpdated', updatedRoomDetails);

    return updatedRoomDetails;
  },
 /**
   * Deletes a group chat.
   * @param {number} chatId - The ID of the chat room to delete.
   * @param {number} requestedById - The user making the request (must be admin).
   */
  async deleteChatRoom(chatId, requestedById) {
    await this._verifyGroupAdmin(chatId, requestedById);
    
    const room = await ChatRooms.findByPk(chatId);
    if (!room) throw new AppError('Chat room not found.', 404);

    // Using a transaction to ensure all related data is deleted
    const transaction = await sequelize.transaction();
    try {
        await ChatMessages.destroy({ where: { chatId }, transaction });
        await ChatParticipants.destroy({ where: { chatId }, transaction });
        await room.destroy({ transaction });
        await transaction.commit();
        
        socketManager.emitToRoom(`chat_${chatId}`, 'chat:roomDeleted', { chatId });
    } catch (error) {
        await transaction.rollback();
        throw new AppError(`Error deleting chat room: ${error.message}`, 500);
    }
  },

  /**
   * Removes a user from a group chat.
   * @param {number} chatId - The ID of the group.
   * @param {number} userIdToRemove - The user to remove.
   * @param {number} requestedById - The user making the request (must be admin).
   */
  async removeUserFromGroup(chatId, userIdToRemove, requestedById) {
    await this._verifyGroupAdmin(chatId, requestedById);

    const participantToRemove = await ChatParticipants.findOne({ where: { chatId, userId: userIdToRemove }});
    if (!participantToRemove) {
      throw new AppError('User is not a member of this group.', 404);
    }

    await participantToRemove.destroy();
    
    socketManager.emitToRoom(`chat_${chatId}`, 'chat:userLeft', { chatId, userId: userIdToRemove });
    socketManager.emitToUser(userIdToRemove, 'chat:removedFromGroup', { chatId });
  },

  /**
   * Deletes a single chat message.
   * @param {number} messageId - The ID of the message to delete.
   * @param {number} requestedById - The user requesting the deletion.
   */
  async deleteChatMessage(messageId, requestedById) {
    const message = await ChatMessages.findByPk(messageId);
    if (!message) {
      throw new AppError('Message not found.', 404);
    }

    const requester = await this._getParticipantIfMember(message.chatId, requestedById);

    // Allow deletion only if the user is the message sender OR a group admin
    if (message.senderId !== requestedById && !requester.isAdmin) {
      throw new AppError('You are not authorized to delete this message.', 403);
    }
    
    await message.destroy();
    
    socketManager.emitToRoom(`chat_${message.chatId}`, 'chat:messageDeleted', { messageId, chatId: message.chatId });
  }

};

  


module.exports = chatService;