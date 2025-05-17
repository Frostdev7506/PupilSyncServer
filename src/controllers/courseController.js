const courseService = require('../services/courseService');
const AppError = require('../utils/errors/AppError');
const { validateCourse } = require('../utils/validators/courseValidator');
const paramParser = require('../utils/paramParser');

const courseController = {
  /**
   * Create a new course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createCourse(req, res, next) {
    try {
      // Validate request body
      const { error } = validateCourse(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current teacher as the creator
      const courseData = {
        ...req.body,
        teacherId: req.user.teacher.teacherId
      };
      
      const course = await courseService.createCourse(courseData);
      
      res.status(201).json({
        status: 'success',
        data: {
          course
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a course by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCourseById(req, res, next) {
    try {
      const { id } = req.params;
      
      const course = await courseService.getCourseById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          course
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all courses with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllCourses(req, res, next) {
    try {
      const { 
        teacherId, 
        institutionId, 
        categoryId, 
        isPublished, 
        format, 
        searchQuery,
        startDate,
        endDate,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder
      } = req.query;
      
      const filters = {
        teacherId: paramParser.parseInteger(teacherId),
        institutionId: paramParser.parseInteger(institutionId),
        categoryId: paramParser.parseInteger(categoryId),
        isPublished: paramParser.parseBoolean(isPublished),
        format,
        searchQuery,
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate),
        minPrice: paramParser.parseFloat(minPrice),
        maxPrice: paramParser.parseFloat(maxPrice),
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'DESC',
        ...paramParser.parsePagination(req.query)
      };
      
      const courses = await courseService.getAllCourses(filters);
      
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
   * Update a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCourse(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateCourse(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to update this course
      const course = await courseService.getCourseById(id);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this course', 403));
      }
      
      const updatedCourse = await courseService.updateCourse(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          course: updatedCourse
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteCourse(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if user is authorized to delete this course
      const course = await courseService.getCourseById(id);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to delete this course', 403));
      }
      
      await courseService.deleteCourse(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Manage course syllabus
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCourseSyllabus(req, res, next) {
    try {
      const { id } = req.params;
      const { syllabus } = req.body;
      
      if (!syllabus) {
        return next(new AppError('Syllabus is required', 400));
      }
      
      // Check if user is authorized to update this course
      const course = await courseService.getCourseById(id);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this course', 403));
      }
      
      const updatedCourse = await courseService.updateCourseSyllabus(id, syllabus);
      
      res.status(200).json({
        status: 'success',
        data: {
          course: updatedCourse
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change course format
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCourseFormat(req, res, next) {
    try {
      const { id } = req.params;
      const { format, formatSettings } = req.body;
      
      if (!format) {
        return next(new AppError('Course format is required', 400));
      }
      
      // Validate format
      const validFormats = ['online', 'blended', 'in-person', 'self-paced', 'project-based'];
      if (!validFormats.includes(format)) {
        return next(new AppError(`Invalid format. Must be one of: ${validFormats.join(', ')}`, 400));
      }
      
      // Check if user is authorized to update this course
      const course = await courseService.getCourseById(id);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this course', 403));
      }
      
      const updatedCourse = await courseService.updateCourseFormat(id, format, formatSettings);
      
      res.status(200).json({
        status: 'success',
        data: {
          course: updatedCourse
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = courseController;
