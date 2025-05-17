const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const discussionTopicService = require('./discussionTopicService');

const models = initModels(sequelize);
const { 
  DiscussionReplies, 
  DiscussionTopics, 
  DiscussionForums, 
  Users 
} = models;

const discussionReplyService = {
  /**
   * Create a new discussion reply
   * @param {Object} replyData - The reply data
   * @returns {Promise<Object>} - The created reply
   */
  async createReply(replyData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if topic exists and is not locked
      const topic = await DiscussionTopics.findByPk(replyData.topicId, {
        include: [{ model: DiscussionForums, as: 'forum' }],
        transaction
      });
      
      if (!topic) {
        await transaction.rollback();
        throw new AppError('Discussion topic not found', 404);
      }
      
      if (topic.isLocked) {
        await transaction.rollback();
        throw new AppError('Cannot reply to a locked topic', 400);
      }
      
      if (!topic.forum.isActive) {
        await transaction.rollback();
        throw new AppError('Cannot reply in an inactive forum', 400);
      }
      
      // Check if parent reply exists (for nested replies)
      if (replyData.parentReplyId) {
        const parentReply = await DiscussionReplies.findByPk(replyData.parentReplyId, { transaction });
        
        if (!parentReply) {
          await transaction.rollback();
          throw new AppError('Parent reply not found', 404);
        }
        
        if (parentReply.topicId !== replyData.topicId) {
          await transaction.rollback();
          throw new AppError('Parent reply does not belong to the specified topic', 400);
        }
      }
      
      // Set initial status based on forum moderation setting
      if (topic.forum.isModerated && replyData.status !== 'pending') {
        replyData.status = 'pending';
      } else if (!topic.forum.isModerated && !replyData.status) {
        replyData.status = 'approved';
      }
      
      // Create the reply
      const reply = await DiscussionReplies.create(replyData, { transaction });
      
      // Update topic statistics if reply is approved
      if (reply.status === 'approved') {
        await discussionTopicService.updateTopicStats(replyData.topicId, replyData.createdBy);
      }
      
      await transaction.commit();
      
      return this.getReplyById(reply.replyId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a reply by ID
   * @param {number} replyId - The reply ID
   * @returns {Promise<Object>} - The reply
   */
  async getReplyById(replyId) {
    const reply = await DiscussionReplies.findByPk(replyId, {
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
        },
        {
          model: Users,
          as: 'moderator',
          attributes: ['userId', 'firstName', 'lastName', 'email']
        },
        {
          model: DiscussionTopics,
          as: 'topic'
        },
        {
          model: DiscussionReplies,
          as: 'parentReply',
          include: [
            {
              model: Users,
              as: 'creator',
              attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
            }
          ]
        }
      ]
    });

    if (!reply) {
      throw new AppError('Discussion reply not found', 404);
    }

    return reply;
  },

  /**
   * Get all replies for a topic
   * @param {number} topicId - The topic ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of replies
   */
  async getTopicReplies(topicId, options = {}) {
    const { status, parentReplyId, limit, offset } = options;
    
    // Verify topic exists
    const topic = await DiscussionTopics.findByPk(topicId);
    
    if (!topic) {
      throw new AppError('Discussion topic not found', 404);
    }
    
    const whereClause = { topicId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (parentReplyId !== undefined) {
      whereClause.parentReplyId = parentReplyId === 'null' ? null : parentReplyId;
    }
    
    const replies = await DiscussionReplies.findAll({
      where: whereClause,
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
        },
        {
          model: DiscussionReplies,
          as: 'parentReply',
          include: [
            {
              model: Users,
              as: 'creator',
              attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
            }
          ]
        }
      ],
      order: [
        ['createdAt', 'ASC']
      ],
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    
    return replies;
  },

  /**
   * Update a reply
   * @param {number} replyId - The reply ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated reply
   */
  async updateReply(replyId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const reply = await DiscussionReplies.findByPk(replyId, {
        include: [{ model: DiscussionTopics, as: 'topic' }],
        transaction
      });
      
      if (!reply) {
        await transaction.rollback();
        throw new AppError('Discussion reply not found', 404);
      }
      
      // Check if topic is locked
      if (reply.topic.isLocked) {
        await transaction.rollback();
        throw new AppError('Cannot update a reply in a locked topic', 400);
      }
      
      const oldStatus = reply.status;
      
      await reply.update(updateData, { transaction });
      
      // If status changed to approved, update topic stats
      if (updateData.status === 'approved' && oldStatus !== 'approved') {
        await discussionTopicService.updateTopicStats(reply.topicId, reply.createdBy);
      }
      
      await transaction.commit();
      
      return this.getReplyById(replyId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Delete a reply
   * @param {number} replyId - The reply ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteReply(replyId) {
    const transaction = await sequelize.transaction();
    
    try {
      const reply = await DiscussionReplies.findByPk(replyId, {
        include: [{ model: DiscussionTopics, as: 'topic' }],
        transaction
      });
      
      if (!reply) {
        await transaction.rollback();
        throw new AppError('Discussion reply not found', 404);
      }
      
      // Check if topic is locked
      if (reply.topic.isLocked) {
        await transaction.rollback();
        throw new AppError('Cannot delete a reply in a locked topic', 400);
      }
      
      const topicId = reply.topicId;
      const wasApproved = reply.status === 'approved';
      
      // Check if reply has child replies
      const childReplies = await DiscussionReplies.findAll({
        where: { parentReplyId: replyId },
        transaction
      });
      
      if (childReplies.length > 0) {
        // Update child replies to point to the parent of this reply
        await DiscussionReplies.update(
          { parentReplyId: reply.parentReplyId },
          {
            where: { parentReplyId: replyId },
            transaction
          }
        );
      }
      
      // Delete the reply
      await reply.destroy({ transaction });
      
      // Update topic statistics if reply was approved
      if (wasApproved) {
        await discussionTopicService.updateTopicStats(topicId, null);
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Moderate a reply (approve or reject)
   * @param {number} replyId - The reply ID
   * @param {Object} moderationData - Moderation data
   * @returns {Promise<Object>} - The moderated reply
   */
  async moderateReply(replyId, moderationData) {
    const { status, moderatedBy, moderationNotes } = moderationData;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      throw new AppError('Valid status (approved or rejected) is required', 400);
    }
    
    if (!moderatedBy) {
      throw new AppError('Moderator ID is required', 400);
    }
    
    const updateData = {
      status,
      moderatedBy,
      moderatedAt: new Date(),
      moderationNotes
    };
    
    return this.updateReply(replyId, updateData);
  },

  /**
   * Mark a reply as accepted answer
   * @param {number} replyId - The reply ID
   * @returns {Promise<Object>} - The updated reply
   */
  async markAsAcceptedAnswer(replyId) {
    const transaction = await sequelize.transaction();
    
    try {
      const reply = await DiscussionReplies.findByPk(replyId, {
        include: [{ model: DiscussionTopics, as: 'topic' }],
        transaction
      });
      
      if (!reply) {
        await transaction.rollback();
        throw new AppError('Discussion reply not found', 404);
      }
      
      // Check if reply is approved
      if (reply.status !== 'approved') {
        await transaction.rollback();
        throw new AppError('Only approved replies can be marked as accepted answers', 400);
      }
      
      const topicId = reply.topicId;
      
      // Unmark any existing accepted answers for this topic
      await DiscussionReplies.update(
        { isAcceptedAnswer: false },
        {
          where: {
            topicId,
            isAcceptedAnswer: true
          },
          transaction
        }
      );
      
      // Mark this reply as accepted
      await reply.update({ isAcceptedAnswer: true }, { transaction });
      
      await transaction.commit();
      
      return this.getReplyById(replyId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Vote on a reply (upvote or downvote)
   * @param {number} replyId - The reply ID
   * @param {string} voteType - The vote type ('up' or 'down')
   * @returns {Promise<Object>} - The updated reply
   */
  async voteOnReply(replyId, voteType) {
    if (!['up', 'down'].includes(voteType)) {
      throw new AppError('Vote type must be either "up" or "down"', 400);
    }
    
    const reply = await DiscussionReplies.findByPk(replyId);
    
    if (!reply) {
      throw new AppError('Discussion reply not found', 404);
    }
    
    // Check if reply is approved
    if (reply.status !== 'approved') {
      throw new AppError('Only approved replies can be voted on', 400);
    }
    
    if (voteType === 'up') {
      await reply.increment('upvoteCount');
    } else {
      await reply.increment('downvoteCount');
    }
    
    return this.getReplyById(replyId);
  }
};

module.exports = discussionReplyService;
