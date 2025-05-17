const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const discussionForumService = require('./discussionForumService');

const models = initModels(sequelize);
const {
  DiscussionTopics,
  DiscussionReplies,
  DiscussionForums,
  Users
} = models;

const discussionTopicService = {
  /**
   * Create a new discussion topic
   * @param {Object} topicData - The topic data
   * @returns {Promise<Object>} - The created topic
   */
  async createTopic(topicData) {
    const transaction = await sequelize.transaction();

    try {
      // Check if forum exists and is active
      const forum = await DiscussionForums.findByPk(topicData.forumId, { transaction });

      if (!forum) {
        await transaction.rollback();
        throw new AppError('Discussion forum not found', 404);
      }

      if (!forum.isActive) {
        await transaction.rollback();
        throw new AppError('Cannot create topic in an inactive forum', 400);
      }

      // Set initial status based on forum moderation setting
      if (forum.isModerated && topicData.status !== 'pending') {
        topicData.status = 'pending';
      } else if (!forum.isModerated && !topicData.status) {
        topicData.status = 'approved';
      }

      // Create the topic
      const topic = await DiscussionTopics.create(topicData, { transaction });

      // Update forum statistics
      await DiscussionForums.update(
        {
          postCount: sequelize.literal('post_count + 1'),
          lastPostAt: new Date(),
          lastPostBy: topicData.createdBy
        },
        {
          where: { forumId: topicData.forumId },
          transaction
        }
      );

      await transaction.commit();

      return this.getTopicById(topic.topicId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a topic by ID
   * @param {number} topicId - The topic ID
   * @returns {Promise<Object>} - The topic
   */
  async getTopicById(topicId) {
    const topic = await DiscussionTopics.findByPk(topicId, {
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
          model: Users,
          as: 'lastReplier',
          attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
        },
        {
          model: DiscussionForums,
          as: 'forum'
        }
      ]
    });

    if (!topic) {
      throw new AppError('Discussion topic not found', 404);
    }

    return topic;
  },

  /**
   * Update a topic
   * @param {number} topicId - The topic ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated topic
   */
  async updateTopic(topicId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const topic = await DiscussionTopics.findByPk(topicId, { transaction });

      if (!topic) {
        await transaction.rollback();
        throw new AppError('Discussion topic not found', 404);
      }

      // If topic is locked, only allow status updates (for moderation)
      if (topic.isLocked && Object.keys(updateData).some(key => key !== 'status' && key !== 'moderatedBy' && key !== 'moderatedAt' && key !== 'moderationNotes')) {
        await transaction.rollback();
        throw new AppError('Cannot update a locked topic except for moderation', 400);
      }

      await topic.update(updateData, { transaction });

      // If status changed to approved, update forum stats
      if (updateData.status === 'approved' && topic.status !== 'approved') {
        await discussionForumService.updateForumStats(topic.forumId, transaction);
      }

      await transaction.commit();

      return this.getTopicById(topicId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Delete a topic
   * @param {number} topicId - The topic ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteTopic(topicId) {
    const transaction = await sequelize.transaction();

    try {
      const topic = await DiscussionTopics.findByPk(topicId, { transaction });

      if (!topic) {
        await transaction.rollback();
        throw new AppError('Discussion topic not found', 404);
      }

      const forumId = topic.forumId;

      // Delete all replies to this topic
      await DiscussionReplies.destroy({
        where: { topicId },
        transaction
      });

      // Delete the topic
      await topic.destroy({ transaction });

      // Update forum statistics
      await discussionForumService.updateForumStats(forumId, transaction);

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Moderate a topic (approve or reject)
   * @param {number} topicId - The topic ID
   * @param {Object} moderationData - Moderation data
   * @returns {Promise<Object>} - The moderated topic
   */
  async moderateTopic(topicId, moderationData) {
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

    return this.updateTopic(topicId, updateData);
  },

  /**
   * Increment view count for a topic
   * @param {number} topicId - The topic ID
   * @returns {Promise<Object>} - The updated topic
   */
  async incrementViewCount(topicId) {
    const topic = await DiscussionTopics.findByPk(topicId);

    if (!topic) {
      throw new AppError('Discussion topic not found', 404);
    }

    await topic.increment('viewCount');

    return this.getTopicById(topicId);
  },

  /**
   * Toggle pin status for a topic
   * @param {number} topicId - The topic ID
   * @returns {Promise<Object>} - The updated topic
   */
  async togglePinStatus(topicId) {
    const topic = await DiscussionTopics.findByPk(topicId);

    if (!topic) {
      throw new AppError('Discussion topic not found', 404);
    }

    await topic.update({ isPinned: !topic.isPinned });

    return this.getTopicById(topicId);
  },

  /**
   * Toggle lock status for a topic
   * @param {number} topicId - The topic ID
   * @returns {Promise<Object>} - The updated topic
   */
  async toggleLockStatus(topicId) {
    const topic = await DiscussionTopics.findByPk(topicId);

    if (!topic) {
      throw new AppError('Discussion topic not found', 404);
    }

    await topic.update({ isLocked: !topic.isLocked });

    return this.getTopicById(topicId);
  },

  /**
   * Update topic statistics after a new reply
   * @param {number} topicId - The topic ID
   * @param {number} replyBy - User ID who replied
   * @returns {Promise<Object>} - The updated topic
   */
  async updateTopicStats(topicId, replyBy) {
    const transaction = await sequelize.transaction();

    try {
      // Get reply count
      const replyCount = await DiscussionReplies.count({
        where: {
          topicId,
          status: 'approved'
        },
        transaction
      });

      // Update topic
      await DiscussionTopics.update(
        {
          replyCount,
          lastReplyAt: new Date(),
          lastReplyBy: replyBy
        },
        {
          where: { topicId },
          transaction
        }
      );

      // Get topic to update forum stats
      const topic = await DiscussionTopics.findByPk(topicId, { transaction });

      // Update forum stats
      await DiscussionForums.update(
        {
          lastPostAt: new Date(),
          lastPostBy: replyBy
        },
        {
          where: { forumId: topic.forumId },
          transaction
        }
      );

      await transaction.commit();
      return this.getTopicById(topicId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

module.exports = discussionTopicService;
