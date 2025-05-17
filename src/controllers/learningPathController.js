const recommendationService = require('../services/recommendationService');
const AppError = require('../utils/errors/AppError');
const { validateLearningPath } = require('../utils/validators/learningPathValidator');
const paramParser = require('../utils/paramParser');

const learningPathController = {
  /**
   * Generate a personalized learning path
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async generateLearningPath(req, res, next) {
    try {
      const { studentId, courseId } = req.params;
      
      // Check if user is authorized to generate a learning path for this student
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          (!req.user.student || req.user.student.studentId !== parseInt(studentId))) {
        return next(new AppError('You are not authorized to generate a learning path for this student', 403));
      }
      
      const learningPath = await recommendationService.generatePersonalizedLearningPath(
        parseInt(studentId),
        parseInt(courseId)
      );
      
      res.status(201).json({
        status: 'success',
        data: {
          learningPath
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a learning path by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getLearningPathById(req, res, next) {
    try {
      const { id } = req.params;
      
      const learningPath = await recommendationService.getLearningPathById(parseInt(id));
      
      // Check if user is authorized to view this learning path
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          (!req.user.student || req.user.student.studentId !== learningPath.studentId)) {
        return next(new AppError('You are not authorized to view this learning path', 403));
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          learningPath
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all learning paths for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentLearningPaths(req, res, next) {
    try {
      const { studentId } = req.params;
      
      // Check if user is authorized to view learning paths for this student
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          (!req.user.student || req.user.student.studentId !== parseInt(studentId))) {
        return next(new AppError('You are not authorized to view learning paths for this student', 403));
      }
      
      const learningPaths = await recommendationService.getStudentLearningPaths(parseInt(studentId));
      
      res.status(200).json({
        status: 'success',
        results: learningPaths.length,
        data: {
          learningPaths
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get course recommendations for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCourseRecommendations(req, res, next) {
    try {
      const { studentId } = req.params;
      const { categoryId, level, limit } = req.query;
      
      // Check if user is authorized to view recommendations for this student
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          (!req.user.student || req.user.student.studentId !== parseInt(studentId))) {
        return next(new AppError('You are not authorized to view recommendations for this student', 403));
      }
      
      const options = {
        categoryId: paramParser.parseInteger(categoryId),
        level,
        limit: paramParser.parseInteger(limit, 5)
      };
      
      const courses = await recommendationService.generateCourseRecommendations(
        parseInt(studentId),
        options
      );
      
      res.status(200).json({
        status: 'success',
        results: courses.length,
        data: {
          courses
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get content recommendations for a student in a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getContentRecommendations(req, res, next) {
    try {
      const { studentId, courseId } = req.params;
      const { limit } = req.query;
      
      // Check if user is authorized to view recommendations for this student
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          (!req.user.student || req.user.student.studentId !== parseInt(studentId))) {
        return next(new AppError('You are not authorized to view recommendations for this student', 403));
      }
      
      const options = {
        limit: paramParser.parseInteger(limit, 5)
      };
      
      const contentBlocks = await recommendationService.generateContentRecommendations(
        parseInt(studentId),
        parseInt(courseId),
        options
      );
      
      res.status(200).json({
        status: 'success',
        results: contentBlocks.length,
        data: {
          contentBlocks
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all recommendations for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentRecommendations(req, res, next) {
    try {
      const { studentId } = req.params;
      const { entityType, limit } = req.query;
      
      // Check if user is authorized to view recommendations for this student
      if (req.user.role !== 'admin' && 
          req.user.role !== 'teacher' && 
          (!req.user.student || req.user.student.studentId !== parseInt(studentId))) {
        return next(new AppError('You are not authorized to view recommendations for this student', 403));
      }
      
      const options = {
        entityType,
        limit: paramParser.parseInteger(limit, 10)
      };
      
      const recommendations = await recommendationService.getStudentRecommendations(
        parseInt(studentId),
        options
      );
      
      res.status(200).json({
        status: 'success',
        results: recommendations.length,
        data: {
          recommendations
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = learningPathController;
