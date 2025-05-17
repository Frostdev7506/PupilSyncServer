const discussionReplyService = require('../services/discussionReplyService');
const AppError = require('../utils/errors/AppError');
const { validateDiscussionReply } = require('../utils/validators/discussionReplyValidator');

const discussionReplyController = {
  /**
   * Create a new discussion reply
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createReply(req, res, next) {
    try {
      // Validate request body
      const { error } = validateDiscussionReply(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current user as the creator
      const replyData = {
        ...req.body,
        createdBy: req.user.userId
      };
      
      const reply = await discussionReplyService.createReply(replyData);
      
      res.status(201).json({
        status: 'success',
        data: {
          reply
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a reply by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getReplyById(req, res, next) {
    try {
      const { id } = req.params;
      
      const reply = await discussionReplyService.getReplyById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          reply
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all replies for a topic
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTopicReplies(req, res, next) {
    try {
      const { topicId } = req.params;
      const { status, parentReplyId, limit, offset } = req.query;
      
      const options = {
        status,
        parentReplyId,
        limit,
        offset
      };
      
      const replies = await discussionReplyService.getTopicReplies(topicId, options);
      
      res.status(200).json({
        status: 'success',
        results: replies.length,
        data: {
          replies
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a reply
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateReply(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateDiscussionReply(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the reply to check ownership
      const reply = await discussionReplyService.getReplyById(id);
      
      // Check if user is authorized to update this reply
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (reply.createdBy !== req.user.userId) {
          return next(new AppError('You are not authorized to update this reply', 403));
        }
        
        // Students can only update content and attachments of their own replies
        const allowedFields = ['content', 'attachments'];
        const requestedFields = Object.keys(req.body);
        
        const hasDisallowedFields = requestedFields.some(field => !allowedFields.includes(field));
        if (hasDisallowedFields) {
          return next(new AppError('You can only update content and attachments', 403));
        }
      }
      
      const updatedReply = await discussionReplyService.updateReply(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          reply: updatedReply
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a reply
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteReply(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the reply to check ownership
      const reply = await discussionReplyService.getReplyById(id);
      
      // Check if user is authorized to delete this reply
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && reply.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to delete this reply', 403));
      }
      
      await discussionReplyService.deleteReply(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Moderate a reply (approve or reject)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async moderateReply(req, res, next) {
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
      
      const reply = await discussionReplyService.moderateReply(id, moderationData);
      
      res.status(200).json({
        status: 'success',
        data: {
          reply
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark a reply as accepted answer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async markAsAcceptedAnswer(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the reply to check if user is authorized
      const reply = await discussionReplyService.getReplyById(id);
      
      // Only teachers, admins, or the topic creator can mark an answer as accepted
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && reply.topic.createdBy !== req.user.userId) {
        return next(new AppError('You are not authorized to mark this reply as accepted', 403));
      }
      
      const updatedReply = await discussionReplyService.markAsAcceptedAnswer(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          reply: updatedReply
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Vote on a reply (upvote or downvote)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async voteOnReply(req, res, next) {
    try {
      const { id } = req.params;
      const { voteType } = req.body;
      
      if (!voteType || !['up', 'down'].includes(voteType)) {
        return next(new AppError('Valid vote type (up or down) is required', 400));
      }
      
      const reply = await discussionReplyService.voteOnReply(id, voteType);
      
      res.status(200).json({
        status: 'success',
        data: {
          reply
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = discussionReplyController;
