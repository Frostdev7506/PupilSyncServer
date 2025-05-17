const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const {
  DiscussionForums,
  DiscussionTopics,
  DiscussionReplies,
  Courses,
  Lessons,
  Classes,
  Users
} = models;

const discussionForumService = {
  /**
   * Create a new discussion forum
   * @param {Object} forumData - The forum data
   * @returns {Promise<Object>} - The created forum
   */
  async createForum(forumData) {
    try {
      const forum = await DiscussionForums.create(forumData);
      return forum;
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a forum by ID
   * @param {number} forumId - The forum ID
   * @returns {Promise<Object>} - The forum
   */
  async getForumById(forumId) {
    const forum = await DiscussionForums.findByPk(forumId, {
      include: [
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Lessons,
          as: 'lesson'
        },
        {
          model: Classes,
          as: 'class'
        },
        {
          model: Users,
          as: 'creator'
        },
        {
          model: Users,
          as: 'lastPoster'
        }
      ]
    });

    if (!forum) {
      throw new AppError('Discussion forum not found', 404);
    }

    return forum;
  },

  /**
   * Get all forums with optional filtering
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of forums
   */
  async getAllForums(filters = {}) {
    const { courseId, lessonId, classId, forumType, isActive } = filters;

    const whereClause = {};

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (lessonId) {
      whereClause.lessonId = lessonId;
    }

    if (classId) {
      whereClause.classId = classId;
    }

    if (forumType) {
      whereClause.forumType = forumType;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    const forums = await DiscussionForums.findAll({
      where: whereClause,
      include: [
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Lessons,
          as: 'lesson'
        },
        {
          model: Classes,
          as: 'class'
        },
        {
          model: Users,
          as: 'creator'
        }
      ],
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    return forums;
  },

  /**
   * Update a forum
   * @param {number} forumId - The forum ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated forum
   */
  async updateForum(forumId, updateData) {
    const forum = await DiscussionForums.findByPk(forumId);

    if (!forum) {
      throw new AppError('Discussion forum not found', 404);
    }

    await forum.update(updateData);

    return this.getForumById(forumId);
  },

  /**
   * Delete a forum
   * @param {number} forumId - The forum ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteForum(forumId) {
    const transaction = await sequelize.transaction();

    try {
      const forum = await DiscussionForums.findByPk(forumId, { transaction });

      if (!forum) {
        await transaction.rollback();
        throw new AppError('Discussion forum not found', 404);
      }

      // Check if forum has topics
      const topicCount = await DiscussionTopics.count({
        where: { forumId },
        transaction
      });

      if (topicCount > 0) {
        await transaction.rollback();
        throw new AppError('Cannot delete forum with existing topics. Delete all topics first or set the forum as inactive.', 400);
      }

      await forum.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Get topics for a forum
   * @param {number} forumId - The forum ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of topics
   */
  async getForumTopics(forumId, options = {}) {
    const { status, isPinned, limit, offset } = options;

    // Verify forum exists
    const forum = await DiscussionForums.findByPk(forumId);

    if (!forum) {
      throw new AppError('Discussion forum not found', 404);
    }

    const whereClause = { forumId };

    if (status) {
      whereClause.status = status;
    }

    if (isPinned !== undefined) {
      whereClause.isPinned = isPinned;
    }

    // First get pinned topics
    let pinnedTopics = [];
    if (isPinned !== false) {
      pinnedTopics = await DiscussionTopics.findAll({
        where: {
          forumId,
          isPinned: true,
          ...(status ? { status } : {})
        },
        include: [
          {
            model: Users,
            as: 'creator',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
          },
          {
            model: Users,
            as: 'lastReplier',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
          }
        ],
        order: [
          ['lastReplyAt', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });
    }

    // Then get non-pinned topics
    const nonPinnedTopics = await DiscussionTopics.findAll({
      where: {
        forumId,
        isPinned: false,
        ...(status ? { status } : {})
      },
      include: [
        {
          model: Users,
          as: 'creator',
          attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
        },
        {
          model: Users,
          as: 'lastReplier',
          attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImageUrl']
        }
      ],
      order: [
        ['lastReplyAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    // Combine pinned and non-pinned topics
    return [...pinnedTopics, ...nonPinnedTopics];
  },

  /**
   * Update forum statistics
   * @param {number} forumId - The forum ID
   * @param {Transaction} [externalTransaction] - Optional external transaction
   * @returns {Promise<Object>} - The updated forum
   */
  async updateForumStats(forumId, externalTransaction = null) {
    // Use the provided transaction or create a new one
    const transaction = externalTransaction || await sequelize.transaction();
    const shouldCommitTransaction = !externalTransaction;

    try {
      // Get post count
      const postCount = await DiscussionTopics.count({
        where: {
          forumId,
          status: 'approved'
        },
        transaction
      });

      // Get last post info
      const lastTopic = await DiscussionTopics.findOne({
        where: {
          forumId,
          status: 'approved'
        },
        order: [['lastReplyAt', 'DESC']],
        transaction
      });

      const updateData = { postCount };

      if (lastTopic) {
        updateData.lastPostAt = lastTopic.lastReplyAt || lastTopic.createdAt;
        updateData.lastPostBy = lastTopic.lastReplyBy || lastTopic.createdBy;
      }

      // Update forum
      await DiscussionForums.update(updateData, {
        where: { forumId },
        transaction
      });

      // Only commit if we created the transaction
      if (shouldCommitTransaction) {
        await transaction.commit();
        return this.getForumById(forumId);
      }

      // If using an external transaction, just return the updated data
      return updateData;
    } catch (error) {
      // Only rollback if we created the transaction
      if (shouldCommitTransaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }
};

module.exports = discussionForumService;
