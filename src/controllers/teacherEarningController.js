const teacherEarningService = require('../services/teacherEarningService');
const AppError = require('../utils/errors/AppError');
const { validateTeacherEarning } = require('../utils/validators/teacherEarningValidator');

const teacherEarningController = {
  /**
   * Create a new earning record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createEarning(req, res, next) {
    try {
      // Validate request body
      const { error } = validateTeacherEarning(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Only admins can create earning records
      if (req.user.role !== 'admin') {
        return next(new AppError('Only administrators can create earning records', 403));
      }

      const earning = await teacherEarningService.createEarning(req.body);
      
      res.status(201).json({
        status: 'success',
        data: {
          earning
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get an earning record by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getEarningById(req, res, next) {
    try {
      const { id } = req.params;
      
      const earning = await teacherEarningService.getEarningById(id);
      
      // Check if the user is authorized to view this earning
      if (req.user.role !== 'admin' && req.user.teacher && req.user.teacher.teacherId !== earning.teacherId) {
        return next(new AppError('You are not authorized to view this earning record', 403));
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          earning
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all earnings for a teacher
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTeacherEarnings(req, res, next) {
    try {
      const { teacherId } = req.params;
      const { status, startDate, endDate, earningType } = req.query;
      
      // Check if the user is authorized to view these earnings
      if (req.user.role !== 'admin' && req.user.teacher && req.user.teacher.teacherId !== parseInt(teacherId)) {
        return next(new AppError('You are not authorized to view these earning records', 403));
      }
      
      const filters = {
        status,
        startDate,
        endDate,
        earningType
      };
      
      const earnings = await teacherEarningService.getTeacherEarnings(teacherId, filters);
      
      res.status(200).json({
        status: 'success',
        results: earnings.length,
        data: {
          earnings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get earnings summary for a teacher
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTeacherEarningsSummary(req, res, next) {
    try {
      const { teacherId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Check if the user is authorized to view these earnings
      if (req.user.role !== 'admin' && req.user.teacher && req.user.teacher.teacherId !== parseInt(teacherId)) {
        return next(new AppError('You are not authorized to view these earning records', 403));
      }
      
      const filters = {
        startDate,
        endDate
      };
      
      const summary = await teacherEarningService.getTeacherEarningsSummary(teacherId, filters);
      
      res.status(200).json({
        status: 'success',
        data: {
          summary
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an earning record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateEarning(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateTeacherEarning(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Only admins can update earning records
      if (req.user.role !== 'admin') {
        return next(new AppError('Only administrators can update earning records', 403));
      }
      
      const earning = await teacherEarningService.updateEarning(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          earning
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an earning record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteEarning(req, res, next) {
    try {
      const { id } = req.params;
      
      // Only admins can delete earning records
      if (req.user.role !== 'admin') {
        return next(new AppError('Only administrators can delete earning records', 403));
      }
      
      await teacherEarningService.deleteEarning(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = teacherEarningController;
