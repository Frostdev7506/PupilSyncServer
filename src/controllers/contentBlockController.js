const contentBlockService = require('../services/contentBlockService');
const lessonService = require('../services/lessonService');
const AppError = require('../utils/errors/AppError');
const { validateContentBlock } = require('../utils/validators/contentBlockValidator');

const contentBlockController = {
  /**
   * Create a new content block
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createContentBlock(req, res, next) {
    try {
      // Validate request body
      const { error } = validateContentBlock(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to add content to this lesson
      const lesson = await lessonService.getLessonById(req.body.lessonId);
      const course = lesson.course;
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to add content to this lesson', 403));
      }
      
      const contentBlock = await contentBlockService.createContentBlock(req.body);
      
      res.status(201).json({
        status: 'success',
        data: {
          contentBlock
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a content block by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getContentBlockById(req, res, next) {
    try {
      const { id } = req.params;
      
      const contentBlock = await contentBlockService.getContentBlockById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          contentBlock
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all content blocks for a lesson
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getContentBlocksByLesson(req, res, next) {
    try {
      const { lessonId } = req.params;
      
      const contentBlocks = await contentBlockService.getContentBlocksByLesson(lessonId);
      
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
   * Update a content block
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateContentBlock(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateContentBlock(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to update this content block
      const contentBlock = await contentBlockService.getContentBlockById(id);
      const lesson = await lessonService.getLessonById(contentBlock.lessonId);
      const course = lesson.course;
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this content block', 403));
      }
      
      const updatedContentBlock = await contentBlockService.updateContentBlock(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          contentBlock: updatedContentBlock
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete a content block
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteContentBlock(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if user is authorized to delete this content block
      const contentBlock = await contentBlockService.getContentBlockById(id);
      const lesson = await lessonService.getLessonById(contentBlock.lessonId);
      const course = lesson.course;
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to delete this content block', 403));
      }
      
      await contentBlockService.deleteContentBlock(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update content block order
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateContentBlockOrder(req, res, next) {
    try {
      const { lessonId } = req.params;
      const { contentBlockOrder } = req.body;
      
      if (!contentBlockOrder || !Array.isArray(contentBlockOrder)) {
        return next(new AppError('Content block order must be an array of content block IDs', 400));
      }
      
      // Check if user is authorized to update this lesson's content blocks
      const lesson = await lessonService.getLessonById(lessonId);
      const course = lesson.course;
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this lesson', 403));
      }
      
      await contentBlockService.updateContentBlockOrder(lessonId, contentBlockOrder);
      
      const contentBlocks = await contentBlockService.getContentBlocksByLesson(lessonId);
      
      res.status(200).json({
        status: 'success',
        data: {
          contentBlocks
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Track content engagement
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async trackContentEngagement(req, res, next) {
    try {
      const { id } = req.params;
      const { engagementType, progress, timeSpent } = req.body;
      
      if (!engagementType) {
        return next(new AppError('Engagement type is required', 400));
      }
      
      const engagementData = {
        contentBlockId: parseInt(id),
        userId: req.user.userId,
        engagementType,
        progress,
        timeSpent
      };
      
      const engagement = await contentBlockService.trackContentEngagement(engagementData);
      
      res.status(200).json({
        status: 'success',
        data: {
          engagement
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get content engagement statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getContentEngagementStats(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if user is authorized to view engagement stats
      const contentBlock = await contentBlockService.getContentBlockById(id);
      const lesson = await lessonService.getLessonById(contentBlock.lessonId);
      const course = lesson.course;
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to view engagement statistics', 403));
      }
      
      const stats = await contentBlockService.getContentEngagementStats(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = contentBlockController;
