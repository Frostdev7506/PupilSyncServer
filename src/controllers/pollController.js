const pollService = require('../services/pollService');
const AppError = require('../utils/errors/AppError');
const { validatePoll, validatePollResponse } = require('../utils/validators/pollValidator');
const paramParser = require('../utils/paramParser');

const pollController = {
  /**
   * Create a new poll
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createPoll(req, res, next) {
    try {
      // Validate request body
      const { error } = validatePoll(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is a teacher
      if (!req.user.teacher) {
        return next(new AppError('Only teachers can create polls', 403));
      }
      
      // Set the current teacher as the creator
      const pollData = {
        ...req.body,
        teacherId: req.user.teacher.teacherId
      };
      
      const poll = await pollService.createPoll(pollData);
      
      res.status(201).json({
        status: 'success',
        data: {
          poll
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a poll by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPollById(req, res, next) {
    try {
      const { id } = req.params;
      const { includeResponses } = req.query;
      
      // Parse includeResponses parameter
      const showResponses = paramParser.parseBoolean(includeResponses, false);
      
      // Only teachers and admins can see responses
      if (showResponses && req.user.role !== 'admin' && !req.user.teacher) {
        return next(new AppError('You are not authorized to view poll responses', 403));
      }
      
      const poll = await pollService.getPollById(id, showResponses);
      
      res.status(200).json({
        status: 'success',
        data: {
          poll
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all polls for the current teacher
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTeacherPolls(req, res, next) {
    try {
      // Check if user is a teacher
      if (!req.user.teacher) {
        return next(new AppError('Only teachers can access their polls', 403));
      }
      
      const { courseId, classId, isActive } = req.query;
      
      const filters = {
        courseId: paramParser.parseInteger(courseId),
        classId: paramParser.parseInteger(classId),
        isActive: paramParser.parseBoolean(isActive)
      };
      
      const polls = await pollService.getPollsByTeacher(req.user.teacher.teacherId, filters);
      
      res.status(200).json({
        status: 'success',
        results: polls.length,
        data: {
          polls
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get active polls for a course or class
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getActivePolls(req, res, next) {
    try {
      const { courseId, classId } = req.query;
      
      if (!courseId && !classId) {
        return next(new AppError('Either courseId or classId is required', 400));
      }
      
      const filters = {
        courseId: paramParser.parseInteger(courseId),
        classId: paramParser.parseInteger(classId)
      };
      
      const polls = await pollService.getActivePolls(filters);
      
      res.status(200).json({
        status: 'success',
        results: polls.length,
        data: {
          polls
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update a poll
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updatePoll(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validatePoll(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the poll to check authorization
      const poll = await pollService.getPollById(id);
      
      // Check if user is authorized to update this poll
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== poll.teacherId)) {
        return next(new AppError('You are not authorized to update this poll', 403));
      }
      
      const updatedPoll = await pollService.updatePoll(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          poll: updatedPoll
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete a poll
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deletePoll(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the poll to check authorization
      const poll = await pollService.getPollById(id);
      
      // Check if user is authorized to delete this poll
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== poll.teacherId)) {
        return next(new AppError('You are not authorized to delete this poll', 403));
      }
      
      await pollService.deletePoll(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Submit a response to a poll
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async submitPollResponse(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validatePollResponse(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is a student
      if (!req.user.student) {
        return next(new AppError('Only students can respond to polls', 403));
      }
      
      const response = await pollService.submitPollResponse(
        parseInt(id),
        req.user.student.studentId,
        req.body.optionId
      );
      
      res.status(201).json({
        status: 'success',
        data: {
          response
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get poll results
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPollResults(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the poll to check authorization
      const poll = await pollService.getPollById(id);
      
      // Only teachers who created the poll and admins can see results
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== poll.teacherId)) {
        return next(new AppError('You are not authorized to view poll results', 403));
      }
      
      const results = await pollService.getPollResults(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          results
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = pollController;
