const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { CourseCategoryMappings, CourseCategories, Courses } = models;

const courseCategoryMappingService = {
  /**
   * Create a new course category mapping
   * @param {Object} mappingData - The mapping data
   * @returns {Promise<Object>} - The created mapping
   */
  async createMapping(mappingData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if course exists
      const course = await Courses.findByPk(mappingData.courseId, { transaction });
      if (!course) {
        await transaction.rollback();
        throw new AppError('Course not found', 404);
      }
      
      // Check if category exists
      const category = await CourseCategories.findByPk(mappingData.categoryId, { transaction });
      if (!category) {
        await transaction.rollback();
        throw new AppError('Category not found', 404);
      }
      
      // Check if mapping already exists
      const existingMapping = await CourseCategoryMappings.findOne({
        where: {
          courseId: mappingData.courseId,
          categoryId: mappingData.categoryId
        },
        transaction
      });
      
      if (existingMapping) {
        await transaction.rollback();
        throw new AppError('This course is already mapped to this category', 400);
      }
      
      // If this is set as primary, unset any existing primary mapping for this course
      if (mappingData.isPrimary) {
        await CourseCategoryMappings.update(
          { isPrimary: false },
          {
            where: {
              courseId: mappingData.courseId,
              isPrimary: true
            },
            transaction
          }
        );
      }
      
      // Create the mapping
      const mapping = await CourseCategoryMappings.create(mappingData, { transaction });
      
      // Update category course count
      await CourseCategories.increment('courseCount', {
        by: 1,
        where: { categoryId: mappingData.categoryId },
        transaction
      });
      
      await transaction.commit();
      return mapping;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a mapping by ID
   * @param {number} mappingId - The mapping ID
   * @returns {Promise<Object>} - The mapping
   */
  async getMappingById(mappingId) {
    const mapping = await CourseCategoryMappings.findByPk(mappingId, {
      include: [
        {
          model: Courses,
          as: 'course'
        },
        {
          model: CourseCategories,
          as: 'category'
        }
      ]
    });

    if (!mapping) {
      throw new AppError('Mapping not found', 404);
    }

    return mapping;
  },

  /**
   * Get all mappings for a course
   * @param {number} courseId - The course ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async getCourseMappings(courseId) {
    const mappings = await CourseCategoryMappings.findAll({
      where: { courseId },
      include: [
        {
          model: CourseCategories,
          as: 'category'
        }
      ],
      order: [
        ['isPrimary', 'DESC'],
        ['createdAt', 'ASC']
      ]
    });
    
    return mappings;
  },

  /**
   * Update a mapping
   * @param {number} mappingId - The mapping ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated mapping
   */
  async updateMapping(mappingId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const mapping = await CourseCategoryMappings.findByPk(mappingId, { transaction });
      
      if (!mapping) {
        await transaction.rollback();
        throw new AppError('Mapping not found', 404);
      }
      
      // If setting as primary, unset any existing primary mapping for this course
      if (updateData.isPrimary) {
        await CourseCategoryMappings.update(
          { isPrimary: false },
          {
            where: {
              courseId: mapping.courseId,
              mappingId: {
                [Op.ne]: mappingId
              },
              isPrimary: true
            },
            transaction
          }
        );
      }
      
      await mapping.update(updateData, { transaction });
      
      await transaction.commit();
      return this.getMappingById(mappingId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Delete a mapping
   * @param {number} mappingId - The mapping ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteMapping(mappingId) {
    const transaction = await sequelize.transaction();
    
    try {
      const mapping = await CourseCategoryMappings.findByPk(mappingId, { transaction });
      
      if (!mapping) {
        await transaction.rollback();
        throw new AppError('Mapping not found', 404);
      }
      
      const categoryId = mapping.categoryId;
      
      // Delete the mapping
      await mapping.destroy({ transaction });
      
      // Update category course count
      await CourseCategories.decrement('courseCount', {
        by: 1,
        where: { categoryId },
        transaction
      });
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Set category mappings for a course (replace all existing mappings)
   * @param {number} courseId - The course ID
   * @param {Array} categoryIds - Array of category IDs
   * @param {number} primaryCategoryId - Primary category ID (optional)
   * @returns {Promise<Array>} - Array of new mappings
   */
  async setCourseCategories(courseId, categoryIds, primaryCategoryId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if course exists
      const course = await Courses.findByPk(courseId, { transaction });
      if (!course) {
        await transaction.rollback();
        throw new AppError('Course not found', 404);
      }
      
      // Check if all categories exist
      const categories = await CourseCategories.findAll({
        where: {
          categoryId: {
            [Op.in]: categoryIds
          }
        },
        transaction
      });
      
      if (categories.length !== categoryIds.length) {
        await transaction.rollback();
        throw new AppError('One or more categories not found', 404);
      }
      
      // Get existing mappings
      const existingMappings = await CourseCategoryMappings.findAll({
        where: { courseId },
        transaction
      });
      
      // Categories to remove
      const existingCategoryIds = existingMappings.map(mapping => mapping.categoryId);
      const categoryIdsToRemove = existingCategoryIds.filter(id => !categoryIds.includes(id));
      
      // Categories to add
      const categoryIdsToAdd = categoryIds.filter(id => !existingCategoryIds.includes(id));
      
      // Remove mappings
      if (categoryIdsToRemove.length > 0) {
        await CourseCategoryMappings.destroy({
          where: {
            courseId,
            categoryId: {
              [Op.in]: categoryIdsToRemove
            }
          },
          transaction
        });
        
        // Update category course counts
        for (const categoryId of categoryIdsToRemove) {
          await CourseCategories.decrement('courseCount', {
            by: 1,
            where: { categoryId },
            transaction
          });
        }
      }
      
      // Add new mappings
      const newMappings = [];
      for (const categoryId of categoryIdsToAdd) {
        const isPrimary = primaryCategoryId && categoryId === primaryCategoryId;
        
        const mapping = await CourseCategoryMappings.create(
          {
            courseId,
            categoryId,
            isPrimary
          },
          { transaction }
        );
        
        newMappings.push(mapping);
        
        // Update category course count
        await CourseCategories.increment('courseCount', {
          by: 1,
          where: { categoryId },
          transaction
        });
      }
      
      // Update primary category if needed
      if (primaryCategoryId) {
        // First, unset all primary flags
        await CourseCategoryMappings.update(
          { isPrimary: false },
          {
            where: { courseId },
            transaction
          }
        );
        
        // Then set the new primary
        await CourseCategoryMappings.update(
          { isPrimary: true },
          {
            where: {
              courseId,
              categoryId: primaryCategoryId
            },
            transaction
          }
        );
      }
      
      await transaction.commit();
      return this.getCourseMappings(courseId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  }
};

module.exports = courseCategoryMappingService;
