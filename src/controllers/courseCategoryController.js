const courseCategoryService = require('../services/courseCategoryService');
const AppError = require('../utils/errors/AppError');
const { validateCourseCategory } = require('../utils/validators/courseCategoryValidator');

const courseCategoryController = {
  /**
   * Create a new course category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createCategory(req, res, next) {
    try {
      // Validate request body
      const { error } = validateCourseCategory(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      const category = await courseCategoryService.createCategory(req.body);
      
      res.status(201).json({
        status: 'success',
        data: {
          category
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a category by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      
      const category = await courseCategoryService.getCategoryById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          category
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a category by slug
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCategoryBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      
      const category = await courseCategoryService.getCategoryBySlug(slug);
      
      res.status(200).json({
        status: 'success',
        data: {
          category
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all categories with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllCategories(req, res, next) {
    try {
      const { isActive, isFeatured, parentCategoryId } = req.query;
      
      const filters = {
        isActive: isActive === 'true',
        isFeatured: isFeatured === 'true',
        parentCategoryId
      };
      
      const categories = await courseCategoryService.getAllCategories(filters);
      
      res.status(200).json({
        status: 'success',
        results: categories.length,
        data: {
          categories
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get categories in a hierarchical structure
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCategoryHierarchy(req, res, next) {
    try {
      const hierarchy = await courseCategoryService.getCategoryHierarchy();
      
      res.status(200).json({
        status: 'success',
        data: {
          categories: hierarchy
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateCourseCategory(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      const category = await courseCategoryService.updateCategory(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          category
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      
      await courseCategoryService.deleteCategory(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get courses in a category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCategoryCourses(req, res, next) {
    try {
      const { id } = req.params;
      const { isPublished, limit, offset } = req.query;
      
      const filters = {
        isPublished: isPublished === 'true',
        limit,
        offset
      };
      
      const courses = await courseCategoryService.getCategoryCourses(id, filters);
      
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
  }
};

module.exports = courseCategoryController;
