const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { CourseCategories, CourseCategoryMappings, Courses } = models;

const courseCategoryService = {
  /**
   * Create a new course category
   * @param {Object} categoryData - The category data
   * @returns {Promise<Object>} - The created category
   */
  async createCategory(categoryData) {
    try {
      // Generate slug from name if not provided
      if (!categoryData.slug) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      const category = await CourseCategories.create(categoryData);
      return category;
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a category by ID
   * @param {number} categoryId - The category ID
   * @returns {Promise<Object>} - The category
   */
  async getCategoryById(categoryId) {
    const category = await CourseCategories.findByPk(categoryId, {
      include: [
        {
          model: CourseCategories,
          as: 'childCategories'
        }
      ]
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  },

  /**
   * Get a category by slug
   * @param {string} slug - The category slug
   * @returns {Promise<Object>} - The category
   */
  async getCategoryBySlug(slug) {
    const category = await CourseCategories.findOne({
      where: { slug },
      include: [
        {
          model: CourseCategories,
          as: 'childCategories'
        }
      ]
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  },

  /**
   * Get all categories with optional filtering
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of categories
   */
  async getAllCategories(filters = {}) {
    const { isActive, isFeatured, parentCategoryId } = filters;
    
    const whereClause = {};
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }
    
    if (isFeatured !== undefined) {
      whereClause.isFeatured = isFeatured;
    }
    
    if (parentCategoryId !== undefined) {
      whereClause.parentCategoryId = parentCategoryId === 'null' ? null : parentCategoryId;
    }
    
    const categories = await CourseCategories.findAll({
      where: whereClause,
      include: [
        {
          model: CourseCategories,
          as: 'childCategories'
        }
      ],
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
    return categories;
  },

  /**
   * Get categories in a hierarchical structure
   * @returns {Promise<Array>} - Array of top-level categories with nested children
   */
  async getCategoryHierarchy() {
    // Get all categories
    const allCategories = await CourseCategories.findAll({
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
    // Convert to a map for easy lookup
    const categoriesMap = new Map();
    allCategories.forEach(category => {
      categoriesMap.set(category.categoryId, {
        ...category.toJSON(),
        children: []
      });
    });
    
    // Build the hierarchy
    const rootCategories = [];
    categoriesMap.forEach(category => {
      if (category.parentCategoryId === null) {
        rootCategories.push(category);
      } else {
        const parent = categoriesMap.get(category.parentCategoryId);
        if (parent) {
          parent.children.push(category);
        }
      }
    });
    
    return rootCategories;
  },

  /**
   * Update a category
   * @param {number} categoryId - The category ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated category
   */
  async updateCategory(categoryId, updateData) {
    const category = await CourseCategories.findByPk(categoryId);
    
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    
    // Generate slug from name if name is updated and slug is not provided
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    await category.update(updateData);
    
    return this.getCategoryById(categoryId);
  },

  /**
   * Delete a category
   * @param {number} categoryId - The category ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteCategory(categoryId) {
    const transaction = await sequelize.transaction();
    
    try {
      const category = await CourseCategories.findByPk(categoryId, { transaction });
      
      if (!category) {
        await transaction.rollback();
        throw new AppError('Category not found', 404);
      }
      
      // Check if category has child categories
      const childCategories = await CourseCategories.findAll({
        where: { parentCategoryId: categoryId },
        transaction
      });
      
      if (childCategories.length > 0) {
        await transaction.rollback();
        throw new AppError('Cannot delete category with child categories', 400);
      }
      
      // Check if category is used in any course mappings
      const categoryMappings = await CourseCategoryMappings.findAll({
        where: { categoryId },
        transaction
      });
      
      if (categoryMappings.length > 0) {
        await transaction.rollback();
        throw new AppError('Cannot delete category that is used by courses', 400);
      }
      
      await category.destroy({ transaction });
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Get courses in a category
   * @param {number} categoryId - The category ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of courses
   */
  async getCategoryCourses(categoryId, filters = {}) {
    const { isPublished, limit, offset } = filters;
    
    // Verify category exists
    const category = await CourseCategories.findByPk(categoryId);
    
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    
    // Get course IDs in this category
    const categoryMappings = await CourseCategoryMappings.findAll({
      where: { categoryId },
      attributes: ['courseId']
    });
    
    const courseIds = categoryMappings.map(mapping => mapping.courseId);
    
    if (courseIds.length === 0) {
      return [];
    }
    
    // Get courses
    const whereClause = {
      courseId: {
        [Op.in]: courseIds
      }
    };
    
    if (isPublished !== undefined) {
      whereClause.isPublished = isPublished;
    }
    
    const courses = await Courses.findAll({
      where: whereClause,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [
        ['rating', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
    
    return courses;
  }
};

module.exports = courseCategoryService;
