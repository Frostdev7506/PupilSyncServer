const discussionTopicService = require('../services/discussionTopicService');
const AppError = require('../utils/errors/AppError');
const { validateDiscussionTopic } = require('../utils/validators/discussionForumValidator');

const discussionTopicController = {
  /**
   * Create a new discussion topic
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createTopic(req, res, next) {
    try {
      // Validate request body
      const { error } = validateDiscussionTopic(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current user as the creator
      const topicData = {
        ...req.body,
        createdBy: req.user.userId
      };

      const topic = await discussionTopicService.createTopic(topicData);

      res.status(201).json({
        status: 'success',
        data: {
          topic
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a topic by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTopicById(req, res, next) {
    try {
      const { id } = req.params;

      const topic = await discussionTopicService.getTopicById(id);

      // Increment view count
      await discussionTopicService.incrementViewCount(id);

      res.status(200).json({
        status: 'success',
        data: {
          topic
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a topic
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateTopic(req, res, next) {
    try {
      const { id } = req.params;

      // Validate request body
      const { error } = validateDiscussionTopic(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Get the topic to check ownership
      const topic = await discussionTopicService.getTopicById(id);

      // Check if user is authorized to update this topic
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (topic.createdBy !== req.user.userId) {
          return next(new AppError('You are not authorized to update this topic', 403));
        }

        // Students can only update certain fields of their own topics
        const allowedFields = ['title', 'content', 'tags', 'attachments'];
        const requestedFields = Object.keys(req.body);

        const hasDisallowedFields = requestedFields.some(field => !allowedFields.includes(field));
        if (hasDisallowedFields) {
          return next(new AppError('You can only update title, content, tags, and attachments', 403));
        }
      }

      const updatedTopic = await discussionTopicService.updateTopic(id, req.body);

      res.status(200).json({
        status: 'success',
        data: {
          topic: updatedTopic
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a topic
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteTopic(req, res, next) {
    try {
      const { id } = req.params;

      // Get the topic to check ownership
      const topic = await discussionTopicService.getTopicById(id);

      // Check if user is authorized to delete this topic
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && topic.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to delete this topic', 403));
      }

      await discussionTopicService.deleteTopic(id);

      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Moderate a topic (approve or reject)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async moderateTopic(req, res, next) {
    try {
      const { id } = req.params;
      const { status, moderationNotes } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return next(new AppError('Valid status (approved or rejected) is required', 400));
      }

      const moderationData = {
        status,
        moderatedBy: req.user.userId,
        moderationNotes
      };

      const topic = await discussionTopicService.moderateTopic(id, moderationData);

      res.status(200).json({
        status: 'success',
        data: {
          topic
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Toggle pin status for a topic
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async togglePinStatus(req, res, next) {
    try {
      const { id } = req.params;

      const topic = await discussionTopicService.togglePinStatus(id);

      res.status(200).json({
        status: 'success',
        data: {
          topic
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Toggle lock status for a topic
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async toggleLockStatus(req, res, next) {
    try {
      const { id } = req.params;

      const topic = await discussionTopicService.toggleLockStatus(id);

      res.status(200).json({
        status: 'success',
        data: {
          topic
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = discussionTopicController;
