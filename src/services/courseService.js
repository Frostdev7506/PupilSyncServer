const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const modelAssociationUtil = require('../utils/modelAssociationUtil');

const models = initModels(sequelize);
const { 
  Courses, 
  Teachers, 
  Institutions, 
  Lessons, 
  ContentBlocks, 
  CourseCategories,
  CourseCategoryMappings,
  Users
} = models;

// Verify required associations
const requiredAssociations = ['teacher', 'institution', 'lessons', 'categories'];
const associationVerification = modelAssociationUtil.verifyRequiredAssociations('Courses', requiredAssociations);

if (!associationVerification.valid) {
  console.error(`Missing required associations for Courses: ${associationVerification.missing.join(', ')}`);
}

const courseService = {
  /**
   * Create a new course
   * @param {Object} courseData - The course data
   * @returns {Promise<Object>} - The created course
   */
  async createCourse(courseData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create the course
      const course = await Courses.create(courseData, { transaction });
      
      // If categories are provided, create the mappings
      if (courseData.categories && Array.isArray(courseData.categories)) {
        const categoryMappings = courseData.categories.map(categoryId => ({
          courseId: course.courseId,
          categoryId,
          isPrimary: categoryId === courseData.primaryCategoryId
        }));
        
        await CourseCategoryMappings.bulkCreate(categoryMappings, { transaction });
      }
      
      // If syllabus is provided, store it
      if (courseData.syllabus) {
        await course.update({ syllabus: courseData.syllabus }, { transaction });
      }
      
      // If format settings are provided, store them
      if (courseData.format && courseData.formatSettings) {
        await course.update({ 
          format: courseData.format,
          formatSettings: courseData.formatSettings
        }, { transaction });
      }
      
      await transaction.commit();
      
      // Return the course with associations
      return this.getCourseById(course.courseId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(`Error creating course: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a course by ID
   * @param {number} courseId - The course ID
   * @returns {Promise<Object>} - The course
   */
  async getCourseById(courseId) {
    try {
      const course = await Courses.findByPk(courseId, {
        include: [
          {
            model: Teachers,
            as: 'teacher',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: Institutions,
            as: 'institution'
          },
          {
            model: Lessons,
            as: 'lessons',
            separate: true,
            order: [['order', 'ASC']]
          },
          {
            model: CourseCategories,
            as: 'categories',
            through: {
              attributes: ['isPrimary']
            }
          }
        ]
      });
      
      if (!course) {
        throw new AppError('Course not found', 404);
      }
      
      return course;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving course: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all courses with optional filtering
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The courses
   */
  async getAllCourses(filters = {}) {
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
        sortOrder,
        limit,
        offset
      } = filters;
      
      // Build the where clause
      const where = {};
      
      if (teacherId) {
        where.teacherId = teacherId;
      }
      
      if (institutionId) {
        where.institutionId = institutionId;
      }
      
      if (isPublished !== undefined) {
        where.isPublished = isPublished;
      }
      
      if (format) {
        where.format = format;
      }
      
      if (searchQuery) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${searchQuery}%` } },
          { description: { [Op.iLike]: `%${searchQuery}%` } }
        ];
      }
      
      if (startDate) {
        where.startDate = { [Op.gte]: startDate };
      }
      
      if (endDate) {
        where.endDate = { [Op.lte]: endDate };
      }
      
      if (minPrice !== undefined) {
        where.price = { ...(where.price || {}), [Op.gte]: minPrice };
      }
      
      if (maxPrice !== undefined) {
        where.price = { ...(where.price || {}), [Op.lte]: maxPrice };
      }
      
      // Build the query options
      const options = {
        where,
        include: [
          {
            model: Teachers,
            as: 'teacher',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: Institutions,
            as: 'institution'
          }
        ],
        order: [[sortBy || 'createdAt', sortOrder || 'DESC']],
        limit: limit || 10,
        offset: offset || 0
      };
      
      // If categoryId is provided, include the category mapping
      if (categoryId) {
        options.include.push({
          model: CourseCategories,
          as: 'categories',
          through: {
            where: { categoryId }
          }
        });
      } else {
        options.include.push({
          model: CourseCategories,
          as: 'categories',
          through: {
            attributes: ['isPrimary']
          }
        });
      }
      
      const courses = await Courses.findAll(options);
      
      return courses;
    } catch (error) {
      throw new AppError(`Error retrieving courses: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a course
   * @param {number} courseId - The course ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated course
   */
  async updateCourse(courseId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const course = await Courses.findByPk(courseId);
      
      if (!course) {
        await transaction.rollback();
        throw new AppError('Course not found', 404);
      }
      
      // Update the course
      await course.update(updateData, { transaction });
      
      // If categories are provided, update the mappings
      if (updateData.categories && Array.isArray(updateData.categories)) {
        // Delete existing mappings
        await CourseCategoryMappings.destroy({
          where: { courseId },
          transaction
        });
        
        // Create new mappings
        const categoryMappings = updateData.categories.map(categoryId => ({
          courseId,
          categoryId,
          isPrimary: categoryId === updateData.primaryCategoryId
        }));
        
        await CourseCategoryMappings.bulkCreate(categoryMappings, { transaction });
      }
      
      await transaction.commit();
      
      // Return the updated course with associations
      return this.getCourseById(courseId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating course: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a course
   * @param {number} courseId - The course ID
   * @returns {Promise<void>}
   */
  async deleteCourse(courseId) {
    const transaction = await sequelize.transaction();
    
    try {
      const course = await Courses.findByPk(courseId);
      
      if (!course) {
        await transaction.rollback();
        throw new AppError('Course not found', 404);
      }
      
      // Delete the course (soft delete if paranoid is true)
      await course.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting course: ${error.message}`, 500);
    }
  },
  
  /**
   * Update course syllabus
   * @param {number} courseId - The course ID
   * @param {Object} syllabus - The syllabus data
   * @returns {Promise<Object>} - The updated course
   */
  async updateCourseSyllabus(courseId, syllabus) {
    try {
      const course = await Courses.findByPk(courseId);
      
      if (!course) {
        throw new AppError('Course not found', 404);
      }
      
      // Update the syllabus
      await course.update({ syllabus });
      
      // Return the updated course with associations
      return this.getCourseById(courseId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating course syllabus: ${error.message}`, 500);
    }
  },
  
  /**
   * Update course format
   * @param {number} courseId - The course ID
   * @param {string} format - The course format
   * @param {Object} formatSettings - The format settings
   * @returns {Promise<Object>} - The updated course
   */
  async updateCourseFormat(courseId, format, formatSettings) {
    try {
      const course = await Courses.findByPk(courseId);
      
      if (!course) {
        throw new AppError('Course not found', 404);
      }
      
      // Update the format and settings
      await course.update({ 
        format,
        formatSettings
      });
      
      // Return the updated course with associations
      return this.getCourseById(courseId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating course format: ${error.message}`, 500);
    }
  }
};

module.exports = courseService;
