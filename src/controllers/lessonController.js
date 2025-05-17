const lessonService = require('../services/lessonService');
const courseService = require('../services/courseService');
const AppError = require('../utils/errors/AppError');
const { validateLesson } = require('../utils/validators/lessonValidator');
const paramParser = require('../utils/paramParser');

const lessonController = {
  /**
   * Create a new lesson
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createLesson(req, res, next) {
    try {
      const { courseId } = req.params;
      
      // Validate request body
      const { error } = validateLesson(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if the course exists and user is authorized
      const course = await courseService.getCourseById(courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to add lessons to this course', 403));
      }
      
      // Set the course ID
      const lessonData = {
        ...req.body,
        courseId: parseInt(courseId)
      };
      
      const lesson = await lessonService.createLesson(lessonData);
      
      res.status(201).json({
        status: 'success',
        data: {
          lesson
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a lesson by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getLessonById(req, res, next) {
    try {
      const { id } = req.params;
      
      const lesson = await lessonService.getLessonById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          lesson
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all lessons for a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getLessonsByCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const { isPublished } = req.query;
      
      const filters = {
        isPublished: paramParser.parseBoolean(isPublished)
      };
      
      const lessons = await lessonService.getLessonsByCourse(courseId, filters);
      
      res.status(200).json({
        status: 'success',
        results: lessons.length,
        data: {
          lessons
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update a lesson
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateLesson(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateLesson(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to update this lesson
      const lesson = await lessonService.getLessonById(id);
      const course = await courseService.getCourseById(lesson.courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this lesson', 403));
      }
      
      const updatedLesson = await lessonService.updateLesson(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          lesson: updatedLesson
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete a lesson
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteLesson(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if user is authorized to delete this lesson
      const lesson = await lessonService.getLessonById(id);
      const course = await courseService.getCourseById(lesson.courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to delete this lesson', 403));
      }
      
      await lessonService.deleteLesson(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update lesson order
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateLessonOrder(req, res, next) {
    try {
      const { courseId } = req.params;
      const { lessonOrder } = req.body;
      
      if (!lessonOrder || !Array.isArray(lessonOrder)) {
        return next(new AppError('Lesson order must be an array of lesson IDs', 400));
      }
      
      // Check if user is authorized to update this course's lessons
      const course = await courseService.getCourseById(courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this course', 403));
      }
      
      await lessonService.updateLessonOrder(courseId, lessonOrder);
      
      const lessons = await lessonService.getLessonsByCourse(courseId);
      
      res.status(200).json({
        status: 'success',
        data: {
          lessons
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Add learning objectives to a lesson
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async addLearningObjectives(req, res, next) {
    try {
      const { id } = req.params;
      const { objectives } = req.body;
      
      if (!objectives || !Array.isArray(objectives)) {
        return next(new AppError('Objectives must be an array of strings', 400));
      }
      
      // Check if user is authorized to update this lesson
      const lesson = await lessonService.getLessonById(id);
      const course = await courseService.getCourseById(lesson.courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this lesson', 403));
      }
      
      const updatedLesson = await lessonService.addLearningObjectives(id, objectives);
      
      res.status(200).json({
        status: 'success',
        data: {
          lesson: updatedLesson
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = lessonController;
