const discussionForumService = require('../services/discussionForumService');
const AppError = require('../utils/errors/AppError');
const { validateDiscussionForum } = require('../utils/validators/discussionForumValidator');

const discussionForumController = {
  /**
   * Create a new discussion forum
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createForum(req, res, next) {
    try {
      // Validate request body
      const { error } = validateDiscussionForum(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current user as the creator
      const forumData = {
        ...req.body,
        createdBy: req.user.userId
      };
      
      const forum = await discussionForumService.createForum(forumData);
      
      res.status(201).json({
        status: 'success',
        data: {
          forum
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a forum by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getForumById(req, res, next) {
    try {
      const { id } = req.params;
      
      const forum = await discussionForumService.getForumById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          forum
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all forums with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllForums(req, res, next) {
    try {
      const { courseId, lessonId, classId, forumType, isActive } = req.query;
      
      const filters = {
        courseId: courseId ? parseInt(courseId) : undefined,
        lessonId: lessonId ? parseInt(lessonId) : undefined,
        classId: classId ? parseInt(classId) : undefined,
        forumType,
        isActive: isActive === 'true'
      };
      
      const forums = await discussionForumService.getAllForums(filters);
      
      res.status(200).json({
        status: 'success',
        results: forums.length,
        data: {
          forums
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a forum
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateForum(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateDiscussionForum(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the forum to check ownership
      const forum = await discussionForumService.getForumById(id);
      
      // Check if user is authorized to update this forum
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && forum.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to update this forum', 403));
      }
      
      const updatedForum = await discussionForumService.updateForum(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          forum: updatedForum
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a forum
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteForum(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the forum to check ownership
      const forum = await discussionForumService.getForumById(id);
      
      // Check if user is authorized to delete this forum
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && forum.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to delete this forum', 403));
      }
      
      await discussionForumService.deleteForum(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get topics for a forum
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getForumTopics(req, res, next) {
    try {
      const { id } = req.params;
      const { status, isPinned, limit, offset } = req.query;
      
      const options = {
        status,
        isPinned: isPinned === 'true',
        limit,
        offset
      };
      
      const topics = await discussionForumService.getForumTopics(id, options);
      
      res.status(200).json({
        status: 'success',
        results: topics.length,
        data: {
          topics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update forum statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateForumStats(req, res, next) {
    try {
      const { id } = req.params;
      
      const forum = await discussionForumService.updateForumStats(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          forum
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = discussionForumController;
