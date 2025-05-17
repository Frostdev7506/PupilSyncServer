const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const modelAssociationUtil = require('../utils/modelAssociationUtil');

const models = initModels(sequelize);
const { 
  Lessons, 
  Courses, 
  ContentBlocks
} = models;

// Verify required associations
const requiredAssociations = ['course', 'contentBlocks'];
const associationVerification = modelAssociationUtil.verifyRequiredAssociations('Lessons', requiredAssociations);

if (!associationVerification.valid) {
  console.error(`Missing required associations for Lessons: ${associationVerification.missing.join(', ')}`);
}

const lessonService = {
  /**
   * Create a new lesson
   * @param {Object} lessonData - The lesson data
   * @returns {Promise<Object>} - The created lesson
   */
  async createLesson(lessonData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if the course exists
      const course = await Courses.findByPk(lessonData.courseId);
      
      if (!course) {
        await transaction.rollback();
        throw new AppError('Course not found', 404);
      }
      
      // Get the current highest order for lessons in this course
      const maxOrderLesson = await Lessons.findOne({
        where: { courseId: lessonData.courseId },
        order: [['order', 'DESC']],
        transaction
      });
      
      const order = maxOrderLesson ? maxOrderLesson.order + 1 : 1;
      
      // Create the lesson
      const lesson = await Lessons.create({
        ...lessonData,
        order
      }, { transaction });
      
      // If content blocks are provided, create them
      if (lessonData.contentBlocks && Array.isArray(lessonData.contentBlocks)) {
        const contentBlocksData = lessonData.contentBlocks.map((block, index) => ({
          ...block,
          lessonId: lesson.lessonId,
          order: index + 1
        }));
        
        await ContentBlocks.bulkCreate(contentBlocksData, { transaction });
      }
      
      await transaction.commit();
      
      // Return the lesson with associations
      return this.getLessonById(lesson.lessonId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error creating lesson: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a lesson by ID
   * @param {number} lessonId - The lesson ID
   * @returns {Promise<Object>} - The lesson
   */
  async getLessonById(lessonId) {
    try {
      const lesson = await Lessons.findByPk(lessonId, {
        include: [
          {
            model: Courses,
            as: 'course'
          },
          {
            model: ContentBlocks,
            as: 'contentBlocks',
            separate: true,
            order: [['order', 'ASC']]
          }
        ]
      });
      
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }
      
      return lesson;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving lesson: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all lessons for a course
   * @param {number} courseId - The course ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The lessons
   */
  async getLessonsByCourse(courseId, filters = {}) {
    try {
      const { isPublished } = filters;
      
      // Build the where clause
      const where = { courseId };
      
      if (isPublished !== undefined) {
        where.isPublished = isPublished;
      }
      
      const lessons = await Lessons.findAll({
        where,
        include: [
          {
            model: ContentBlocks,
            as: 'contentBlocks',
            separate: true,
            order: [['order', 'ASC']]
          }
        ],
        order: [['order', 'ASC']]
      });
      
      return lessons;
    } catch (error) {
      throw new AppError(`Error retrieving lessons: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a lesson
   * @param {number} lessonId - The lesson ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated lesson
   */
  async updateLesson(lessonId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const lesson = await Lessons.findByPk(lessonId);
      
      if (!lesson) {
        await transaction.rollback();
        throw new AppError('Lesson not found', 404);
      }
      
      // Update the lesson
      await lesson.update(updateData, { transaction });
      
      // If content blocks are provided, update them
      if (updateData.contentBlocks && Array.isArray(updateData.contentBlocks)) {
        // Delete existing content blocks
        await ContentBlocks.destroy({
          where: { lessonId },
          transaction
        });
        
        // Create new content blocks
        const contentBlocksData = updateData.contentBlocks.map((block, index) => ({
          ...block,
          lessonId,
          order: index + 1
        }));
        
        await ContentBlocks.bulkCreate(contentBlocksData, { transaction });
      }
      
      await transaction.commit();
      
      // Return the updated lesson with associations
      return this.getLessonById(lessonId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating lesson: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a lesson
   * @param {number} lessonId - The lesson ID
   * @returns {Promise<void>}
   */
  async deleteLesson(lessonId) {
    const transaction = await sequelize.transaction();
    
    try {
      const lesson = await Lessons.findByPk(lessonId);
      
      if (!lesson) {
        await transaction.rollback();
        throw new AppError('Lesson not found', 404);
      }
      
      // Delete the lesson (soft delete if paranoid is true)
      await lesson.destroy({ transaction });
      
      // Reorder remaining lessons
      const remainingLessons = await Lessons.findAll({
        where: { 
          courseId: lesson.courseId,
          order: { [Op.gt]: lesson.order }
        },
        order: [['order', 'ASC']],
        transaction
      });
      
      for (const remainingLesson of remainingLessons) {
        await remainingLesson.update({ order: remainingLesson.order - 1 }, { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting lesson: ${error.message}`, 500);
    }
  },
  
  /**
   * Update lesson order
   * @param {number} courseId - The course ID
   * @param {Array<number>} lessonOrder - The new lesson order (array of lesson IDs)
   * @returns {Promise<void>}
   */
  async updateLessonOrder(courseId, lessonOrder) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify all lessons exist and belong to the course
      const lessons = await Lessons.findAll({
        where: { 
          courseId,
          lessonId: { [Op.in]: lessonOrder }
        },
        transaction
      });
      
      if (lessons.length !== lessonOrder.length) {
        await transaction.rollback();
        throw new AppError('One or more lessons not found or do not belong to this course', 400);
      }
      
      // Update the order of each lesson
      for (let i = 0; i < lessonOrder.length; i++) {
        await Lessons.update(
          { order: i + 1 },
          { 
            where: { lessonId: lessonOrder[i] },
            transaction
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating lesson order: ${error.message}`, 500);
    }
  },
  
  /**
   * Add learning objectives to a lesson
   * @param {number} lessonId - The lesson ID
   * @param {Array<string>} objectives - The learning objectives
   * @returns {Promise<Object>} - The updated lesson
   */
  async addLearningObjectives(lessonId, objectives) {
    try {
      const lesson = await Lessons.findByPk(lessonId);
      
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }
      
      // Update the learning objectives
      const currentObjectives = lesson.learningObjectives || [];
      const updatedObjectives = [...new Set([...currentObjectives, ...objectives])];
      
      await lesson.update({ learningObjectives: updatedObjectives });
      
      // Return the updated lesson with associations
      return this.getLessonById(lessonId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error adding learning objectives: ${error.message}`, 500);
    }
  }
};

module.exports = lessonService;
