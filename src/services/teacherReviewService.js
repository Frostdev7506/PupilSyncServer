const { Op, Sequelize } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { TeacherReviews, Teachers, Users, Courses, Students, TeacherProfiles } = models;

const teacherReviewService = {
  /**
   * Create a new teacher review
   * @param {Object} reviewData - The review data
   * @returns {Promise<Object>} - The created review
   */
  async createReview(reviewData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if the student has already reviewed this teacher
      const existingReview = await TeacherReviews.findOne({
        where: {
          teacherId: reviewData.teacherId,
          studentId: reviewData.studentId,
          courseId: reviewData.courseId
        },
        transaction
      });
      
      if (existingReview) {
        await transaction.rollback();
        throw new AppError('You have already reviewed this teacher for this course', 400);
      }
      
      // Create the review
      const review = await TeacherReviews.create(reviewData, { transaction });
      
      // Update teacher's rating in their profile
      const teacherReviews = await TeacherReviews.findAll({
        where: {
          teacherId: reviewData.teacherId,
          status: 'approved'
        },
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
          [Sequelize.fn('COUNT', Sequelize.col('review_id')), 'reviewCount']
        ],
        transaction
      });
      
      if (teacherReviews && teacherReviews[0]) {
        const { averageRating, reviewCount } = teacherReviews[0].dataValues;
        
        // Update teacher profile with new rating and review count
        await TeacherProfiles.update(
          {
            rating: averageRating,
            reviewCount
          },
          {
            where: { teacherId: reviewData.teacherId },
            transaction
          }
        );
      }
      
      await transaction.commit();
      return review;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a review by ID
   * @param {number} reviewId - The review ID
   * @returns {Promise<Object>} - The review
   */
  async getReviewById(reviewId) {
    const review = await TeacherReviews.findByPk(reviewId, {
      include: [
        {
          model: Teachers,
          as: 'teacher',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Users,
          as: 'moderator'
        }
      ]
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    return review;
  },

  /**
   * Get all reviews for a teacher
   * @param {number} teacherId - The teacher ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of reviews
   */
  async getTeacherReviews(teacherId, filters = {}) {
    const { status, minRating, maxRating, isPublic } = filters;
    
    const whereClause = { teacherId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (minRating) {
      whereClause.rating = {
        ...whereClause.rating,
        [Op.gte]: minRating
      };
    }
    
    if (maxRating) {
      whereClause.rating = {
        ...whereClause.rating,
        [Op.lte]: maxRating
      };
    }
    
    if (isPublic !== undefined) {
      whereClause.isPublic = isPublic;
    }
    
    const reviews = await TeacherReviews.findAll({
      where: whereClause,
      include: [
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Courses,
          as: 'course'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return reviews;
  },

  /**
   * Get all reviews by a student
   * @param {number} studentId - The student ID
   * @returns {Promise<Array>} - Array of reviews
   */
  async getStudentReviews(studentId) {
    const reviews = await TeacherReviews.findAll({
      where: { studentId },
      include: [
        {
          model: Teachers,
          as: 'teacher',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Courses,
          as: 'course'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return reviews;
  },

  /**
   * Update a review
   * @param {number} reviewId - The review ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated review
   */
  async updateReview(reviewId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const review = await TeacherReviews.findByPk(reviewId, { transaction });
      
      if (!review) {
        await transaction.rollback();
        throw new AppError('Review not found', 404);
      }
      
      // Update the review
      await review.update(updateData, { transaction });
      
      // If the status changed to approved or the rating changed, update the teacher's rating
      if (updateData.status === 'approved' || updateData.rating) {
        const teacherReviews = await TeacherReviews.findAll({
          where: {
            teacherId: review.teacherId,
            status: 'approved'
          },
          attributes: [
            [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
            [Sequelize.fn('COUNT', Sequelize.col('review_id')), 'reviewCount']
          ],
          transaction
        });
        
        if (teacherReviews && teacherReviews[0]) {
          const { averageRating, reviewCount } = teacherReviews[0].dataValues;
          
          // Update teacher profile with new rating and review count
          await TeacherProfiles.update(
            {
              rating: averageRating,
              reviewCount
            },
            {
              where: { teacherId: review.teacherId },
              transaction
            }
          );
        }
      }
      
      await transaction.commit();
      return this.getReviewById(reviewId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Add teacher response to a review
   * @param {number} reviewId - The review ID
   * @param {string} response - The teacher's response
   * @returns {Promise<Object>} - The updated review
   */
  async addTeacherResponse(reviewId, response) {
    const review = await TeacherReviews.findByPk(reviewId);
    
    if (!review) {
      throw new AppError('Review not found', 404);
    }
    
    await review.update({
      teacherResponse: response,
      teacherResponseAt: new Date()
    });
    
    return this.getReviewById(reviewId);
  },

  /**
   * Delete a review
   * @param {number} reviewId - The review ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteReview(reviewId) {
    const transaction = await sequelize.transaction();
    
    try {
      const review = await TeacherReviews.findByPk(reviewId, { transaction });
      
      if (!review) {
        await transaction.rollback();
        throw new AppError('Review not found', 404);
      }
      
      const teacherId = review.teacherId;
      
      // Delete the review
      await review.destroy({ transaction });
      
      // Update teacher's rating
      const teacherReviews = await TeacherReviews.findAll({
        where: {
          teacherId,
          status: 'approved'
        },
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
          [Sequelize.fn('COUNT', Sequelize.col('review_id')), 'reviewCount']
        ],
        transaction
      });
      
      if (teacherReviews && teacherReviews[0]) {
        const { averageRating, reviewCount } = teacherReviews[0].dataValues;
        
        // Update teacher profile with new rating and review count
        await TeacherProfiles.update(
          {
            rating: averageRating || 0,
            reviewCount: reviewCount || 0
          },
          {
            where: { teacherId },
            transaction
          }
        );
      } else {
        // No reviews left, reset rating
        await TeacherProfiles.update(
          {
            rating: null,
            reviewCount: 0
          },
          {
            where: { teacherId },
            transaction
          }
        );
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  }
};

module.exports = teacherReviewService;
