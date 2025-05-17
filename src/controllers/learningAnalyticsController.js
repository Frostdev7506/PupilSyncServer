const learningAnalyticsService = require('../services/learningAnalyticsService');
const AppError = require('../utils/errors/AppError');
const { validateLearningAnalytics } = require('../utils/validators/learningAnalyticsValidator');
const parentStudentUtil = require('../utils/parentStudentUtil');

const learningAnalyticsController = {
  /**
   * Create or update learning analytics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createOrUpdateAnalytics(req, res, next) {
    try {
      // Validate request body
      const { error } = validateLearningAnalytics(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Only teachers and admins can create/update analytics
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return next(new AppError('Only teachers and administrators can create or update analytics', 403));
      }

      const analytics = await learningAnalyticsService.createOrUpdateAnalytics(req.body);

      res.status(200).json({
        status: 'success',
        data: {
          analytics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get analytics by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAnalyticsById(req, res, next) {
    try {
      const { id } = req.params;

      const analytics = await learningAnalyticsService.getAnalyticsById(id);

      // Check if user is authorized to view these analytics
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.student && req.user.student.studentId !== analytics.studentId) {
          return next(new AppError('You can only view your own analytics', 403));
        }

        if (req.user.parent) {
          // Check if parent is linked to this student
          try {
            const isLinked = await parentStudentUtil.isParentLinkedToStudent(
              req.user.parent.parentId,
              analytics.studentId
            );

            if (!isLinked) {
              return next(new AppError('You can only view analytics for your children', 403));
            }
          } catch (error) {
            return next(new AppError('Error verifying parent-student relationship', 500));
          }
        }
      }

      res.status(200).json({
        status: 'success',
        data: {
          analytics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all analytics for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentAnalytics(req, res, next) {
    try {
      const { studentId } = req.params;
      const { entityType, entityId, metricType } = req.query;

      // Check if user is authorized to view these analytics
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.student && req.user.student.studentId !== parseInt(studentId)) {
          return next(new AppError('You can only view your own analytics', 403));
        }

        if (req.user.parent) {
          // Check if parent is linked to this student
          try {
            const isLinked = await parentStudentUtil.isParentLinkedToStudent(
              req.user.parent.parentId,
              parseInt(studentId)
            );

            if (!isLinked) {
              return next(new AppError('You can only view analytics for your children', 403));
            }
          } catch (error) {
            return next(new AppError('Error verifying parent-student relationship', 500));
          }
        }
      }

      const filters = {
        entityType,
        entityId: entityId ? parseInt(entityId) : undefined,
        metricType
      };

      const analytics = await learningAnalyticsService.getStudentAnalytics(studentId, filters);

      res.status(200).json({
        status: 'success',
        results: analytics.length,
        data: {
          analytics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all analytics for an entity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getEntityAnalytics(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const { studentId, metricType } = req.query;

      // Only teachers and admins can view entity analytics
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return next(new AppError('Only teachers and administrators can view entity analytics', 403));
      }

      const filters = {
        studentId: studentId ? parseInt(studentId) : undefined,
        metricType
      };

      const analytics = await learningAnalyticsService.getEntityAnalytics(entityType, entityId, filters);

      res.status(200).json({
        status: 'success',
        results: analytics.length,
        data: {
          analytics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete analytics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteAnalytics(req, res, next) {
    try {
      const { id } = req.params;

      // Only teachers and admins can delete analytics
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return next(new AppError('Only teachers and administrators can delete analytics', 403));
      }

      await learningAnalyticsService.deleteAnalytics(id);

      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generate course performance analytics for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async generateCoursePerformanceAnalytics(req, res, next) {
    try {
      const { studentId, courseId } = req.params;

      // Check if user is authorized to generate these analytics
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.student && req.user.student.studentId !== parseInt(studentId)) {
          return next(new AppError('You can only generate analytics for yourself', 403));
        }
      }

      const analytics = await learningAnalyticsService.generateCoursePerformanceAnalytics(
        parseInt(studentId),
        parseInt(courseId)
      );

      res.status(200).json({
        status: 'success',
        data: {
          analytics
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get class performance analytics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getClassPerformanceAnalytics(req, res, next) {
    try {
      const { classId } = req.params;

      // Only teachers and admins can view class analytics
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return next(new AppError('Only teachers and administrators can view class analytics', 403));
      }

      const analytics = await learningAnalyticsService.getClassPerformanceAnalytics(parseInt(classId));

      res.status(200).json({
        status: 'success',
        data: {
          analytics
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = learningAnalyticsController;
