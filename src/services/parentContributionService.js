const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const parentStudentUtil = require('../utils/parentStudentUtil');
const parentAccessSettingsService = require('./parentAccessSettingsService');

const models = initModels(sequelize);
const { 
  Parents, 
  Students, 
  Users, 
  Teachers,
  Courses,
  ParentRecommendedMaterials,
  ParentCourseFeedback,
  ParentVolunteerActivities
} = models;

const parentContributionService = {
  /**
   * Recommend practice materials for a student
   * @param {Object} materialData - The material data
   * @returns {Promise<Object>} - The created recommendation
   */
  async recommendMaterial(materialData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { parentId, studentId, courseId, title, description, materialType, materialUrl, notes } = materialData;
      
      // Check if parent is linked to student
      const isLinked = await parentStudentUtil.isParentLinkedToStudent(parentId, studentId, { transaction });
      
      if (!isLinked) {
        await transaction.rollback();
        throw new AppError('Parent is not linked to this student', 403);
      }
      
      // Check if student is enrolled in the course
      if (courseId) {
        const isEnrolled = await Courses.findOne({
          where: { courseId },
          include: [
            {
              model: Students,
              as: 'students',
              where: { studentId },
              required: true
            }
          ],
          transaction
        });
        
        if (!isEnrolled) {
          await transaction.rollback();
          throw new AppError('Student is not enrolled in this course', 400);
        }
      }
      
      // Create the recommendation
      const recommendation = await ParentRecommendedMaterials.create({
        parentId,
        studentId,
        courseId,
        title,
        description,
        materialType,
        materialUrl,
        notes,
        status: 'pending',
        createdAt: new Date()
      }, { transaction });
      
      await transaction.commit();
      
      // Return the recommendation with associations
      return ParentRecommendedMaterials.findByPk(recommendation.recommendationId, {
        include: [
          {
            model: Parents,
            as: 'parent',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          },
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          },
          {
            model: Courses,
            as: 'course'
          }
        ]
      });
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error recommending material: ${error.message}`, 500);
    }
  },
  
  /**
   * Get recommended materials for a parent
   * @param {number} parentId - The parent ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The recommended materials
   */
  async getRecommendedMaterials(parentId, filters = {}) {
    try {
      const { studentId, courseId, status } = filters;
      
      // Build the where clause
      const whereClause = { parentId };
      
      if (studentId) {
        whereClause.studentId = studentId;
      }
      
      if (courseId) {
        whereClause.courseId = courseId;
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      // Get recommendations
      const recommendations = await ParentRecommendedMaterials.findAll({
        where: whereClause,
        include: [
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          },
          {
            model: Courses,
            as: 'course'
          },
          {
            model: Teachers,
            as: 'reviewedBy',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return recommendations;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving recommended materials: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a recommended material
   * @param {number} recommendationId - The recommendation ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated recommendation
   */
  async updateRecommendedMaterial(recommendationId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const recommendation = await ParentRecommendedMaterials.findByPk(recommendationId, { transaction });
      
      if (!recommendation) {
        await transaction.rollback();
        throw new AppError('Recommendation not found', 404);
      }
      
      // Check if user is authorized to update this recommendation
      if (updateData.parentId && recommendation.parentId !== updateData.parentId) {
        await transaction.rollback();
        throw new AppError('You can only update your own recommendations', 403);
      }
      
      // Update the recommendation
      await recommendation.update(updateData, { transaction });
      
      await transaction.commit();
      
      // Return the updated recommendation with associations
      return ParentRecommendedMaterials.findByPk(recommendationId, {
        include: [
          {
            model: Parents,
            as: 'parent',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          },
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          },
          {
            model: Courses,
            as: 'course'
          },
          {
            model: Teachers,
            as: 'reviewedBy',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          }
        ]
      });
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating recommended material: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a recommended material
   * @param {number} recommendationId - The recommendation ID
   * @param {number} parentId - The parent ID
   * @returns {Promise<Object>} - The deletion result
   */
  async deleteRecommendedMaterial(recommendationId, parentId) {
    const transaction = await sequelize.transaction();
    
    try {
      const recommendation = await ParentRecommendedMaterials.findByPk(recommendationId, { transaction });
      
      if (!recommendation) {
        await transaction.rollback();
        throw new AppError('Recommendation not found', 404);
      }
      
      // Check if user is authorized to delete this recommendation
      if (recommendation.parentId !== parentId) {
        await transaction.rollback();
        throw new AppError('You can only delete your own recommendations', 403);
      }
      
      // Check if recommendation has been approved
      if (recommendation.status === 'approved') {
        await transaction.rollback();
        throw new AppError('Cannot delete an approved recommendation', 400);
      }
      
      // Delete the recommendation
      await recommendation.destroy({ transaction });
      
      await transaction.commit();
      
      return { success: true, message: 'Recommendation deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting recommended material: ${error.message}`, 500);
    }
  },
  
  /**
   * Provide feedback on a course
   * @param {Object} feedbackData - The feedback data
   * @returns {Promise<Object>} - The created feedback
   */
  async provideCourseFeeback(feedbackData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { parentId, studentId, courseId, teachingQualityRating, contentQualityRating, communicationRating, overallRating, comments, suggestions, isAnonymous } = feedbackData;
      
      // Check if parent is linked to student
      const isLinked = await parentStudentUtil.isParentLinkedToStudent(parentId, studentId, { transaction });
      
      if (!isLinked) {
        await transaction.rollback();
        throw new AppError('Parent is not linked to this student', 403);
      }
      
      // Check if student is enrolled in the course
      const isEnrolled = await Courses.findOne({
        where: { courseId },
        include: [
          {
            model: Students,
            as: 'students',
            where: { studentId },
            required: true
          }
        ],
        transaction
      });
      
      if (!isEnrolled) {
        await transaction.rollback();
        throw new AppError('Student is not enrolled in this course', 400);
      }
      
      // Create the feedback
      const feedback = await ParentCourseFeedback.create({
        parentId,
        studentId,
        courseId,
        teachingQualityRating,
        contentQualityRating,
        communicationRating,
        overallRating,
        comments,
        suggestions,
        isAnonymous: isAnonymous || false,
        submittedAt: new Date(),
        status: 'pending'
      }, { transaction });
      
      await transaction.commit();
      
      // Return the feedback with associations
      return ParentCourseFeedback.findByPk(feedback.feedbackId, {
        include: [
          {
            model: Parents,
            as: 'parent',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          },
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          },
          {
            model: Courses,
            as: 'course',
            include: [
              {
                model: Teachers,
                as: 'teacher',
                include: [
                  {
                    model: Users,
                    as: 'user',
                    attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
                  }
                ]
              }
            ]
          }
        ]
      });
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error providing course feedback: ${error.message}`, 500);
    }
  }
};

module.exports = parentContributionService;
