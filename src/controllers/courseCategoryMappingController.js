const courseCategoryMappingService = require('../services/courseCategoryMappingService');
const AppError = require('../utils/errors/AppError');
const { validateCourseCategoryMapping } = require('../utils/validators/courseCategoryMappingValidator');

const courseCategoryMappingController = {
  /**
   * Create a new course category mapping
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createMapping(req, res, next) {
    try {
      // Validate request body
      const { error } = validateCourseCategoryMapping(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const mapping = await courseCategoryMappingService.createMapping(req.body);
      
      res.status(201).json({
        status: 'success',
        data: {
          mapping
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a mapping by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getMappingById(req, res, next) {
    try {
      const { id } = req.params;
      
      const mapping = await courseCategoryMappingService.getMappingById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          mapping
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all mappings for a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCourseMappings(req, res, next) {
    try {
      const { courseId } = req.params;
      
      const mappings = await courseCategoryMappingService.getCourseMappings(courseId);
      
      res.status(200).json({
        status: 'success',
        results: mappings.length,
        data: {
          mappings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a mapping
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateMapping(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateCourseCategoryMapping(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      const mapping = await courseCategoryMappingService.updateMapping(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          mapping
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a mapping
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteMapping(req, res, next) {
    try {
      const { id } = req.params;
      
      await courseCategoryMappingService.deleteMapping(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Set category mappings for a course (replace all existing mappings)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async setCourseCategories(req, res, next) {
    try {
      const { courseId } = req.params;
      const { categoryIds, primaryCategoryId } = req.body;
      
      if (!categoryIds || !Array.isArray(categoryIds)) {
        return next(new AppError('categoryIds must be an array', 400));
      }
      
      const mappings = await courseCategoryMappingService.setCourseCategories(
        courseId,
        categoryIds,
        primaryCategoryId
      );
      
      res.status(200).json({
        status: 'success',
        results: mappings.length,
        data: {
          mappings
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = courseCategoryMappingController;
