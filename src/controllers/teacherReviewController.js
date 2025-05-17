const teacherReviewService = require('../services/teacherReviewService');
const AppError = require('../utils/errors/AppError');
const { validateTeacherReview } = require('../utils/validators/teacherReviewValidator');

const teacherReviewController = {
  /**
   * Create a new teacher review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createReview(req, res, next) {
    try {
      // Validate request body
      const { error } = validateTeacherReview(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Ensure the student ID matches the authenticated user's student ID
      if (req.user.student && req.user.student.studentId !== req.body.studentId) {
        return next(new AppError('You can only create reviews as yourself', 403));
      }

      const reviewData = {
        ...req.body,
        studentId: req.user.student.studentId,
        status: 'pending' // All reviews start as pending and need moderation
      };
      
      const review = await teacherReviewService.createReview(reviewData);
      
      res.status(201).json({
        status: 'success',
        data: {
          review
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a review by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getReviewById(req, res, next) {
    try {
      const { id } = req.params;
      
      const review = await teacherReviewService.getReviewById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          review
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all reviews for a teacher
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTeacherReviews(req, res, next) {
    try {
      const { teacherId } = req.params;
      const { status, minRating, maxRating, isPublic } = req.query;
      
      const filters = {
        status,
        minRating: minRating ? parseInt(minRating) : undefined,
        maxRating: maxRating ? parseInt(maxRating) : undefined,
        isPublic: isPublic === 'true'
      };
      
      const reviews = await teacherReviewService.getTeacherReviews(teacherId, filters);
      
      res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
          reviews
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all reviews by a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentReviews(req, res, next) {
    try {
      const { studentId } = req.params;
      
      // Ensure the student ID matches the authenticated user's student ID or user is admin
      if (req.user.role !== 'admin' && req.user.student && req.user.student.studentId !== parseInt(studentId)) {
        return next(new AppError('You can only view your own reviews', 403));
      }
      
      const reviews = await teacherReviewService.getStudentReviews(studentId);
      
      res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
          reviews
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateReview(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateTeacherReview(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the review to check ownership
      const review = await teacherReviewService.getReviewById(id);
      
      // Check if user is authorized to update this review
      if (req.user.role === 'admin') {
        // Admins can update any review
      } else if (req.user.student && req.user.student.studentId === review.studentId) {
        // Students can only update their own reviews and only certain fields
        const allowedFields = ['reviewText', 'rating', 'isPublic'];
        const requestedFields = Object.keys(req.body);
        
        const hasDisallowedFields = requestedFields.some(field => !allowedFields.includes(field));
        if (hasDisallowedFields) {
          return next(new AppError('You can only update review text, rating, and visibility', 403));
        }
        
        // If the review was already approved, changing it will set it back to pending
        if (review.status === 'approved' && (req.body.reviewText || req.body.rating)) {
          req.body.status = 'pending';
        }
      } else {
        return next(new AppError('You are not authorized to update this review', 403));
      }
      
      const updatedReview = await teacherReviewService.updateReview(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          review: updatedReview
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add teacher response to a review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async addTeacherResponse(req, res, next) {
    try {
      const { id } = req.params;
      const { response } = req.body;
      
      if (!response) {
        return next(new AppError('Response text is required', 400));
      }
      
      // Get the review to check if the teacher is authorized
      const review = await teacherReviewService.getReviewById(id);
      
      // Ensure the teacher ID matches the authenticated user's teacher ID
      if (req.user.teacher && req.user.teacher.teacherId !== review.teacherId) {
        return next(new AppError('You can only respond to reviews of your teaching', 403));
      }
      
      const updatedReview = await teacherReviewService.addTeacherResponse(id, response);
      
      res.status(200).json({
        status: 'success',
        data: {
          review: updatedReview
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Moderate a review (approve or reject)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async moderateReview(req, res, next) {
    try {
      const { id } = req.params;
      const { status, moderationNotes } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return next(new AppError('Valid status (approved or rejected) is required', 400));
      }
      
      const updateData = {
        status,
        moderationNotes,
        moderatedBy: req.user.userId,
        moderatedAt: new Date()
      };
      
      const updatedReview = await teacherReviewService.updateReview(id, updateData);
      
      res.status(200).json({
        status: 'success',
        data: {
          review: updatedReview
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the review to check ownership
      const review = await teacherReviewService.getReviewById(id);
      
      // Check if user is authorized to delete this review
      if (req.user.role === 'admin') {
        // Admins can delete any review
      } else if (req.user.student && req.user.student.studentId === review.studentId) {
        // Students can delete their own reviews
      } else {
        return next(new AppError('You are not authorized to delete this review', 403));
      }
      
      await teacherReviewService.deleteReview(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = teacherReviewController;
