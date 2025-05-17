const teacherProfileService = require('../services/teacherProfileService');
const AppError = require('../utils/errors/AppError');
const { validateTeacherProfile } = require('../utils/validators/teacherProfileValidator');

const teacherProfileController = {
  /**
   * Create a new teacher profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createProfile(req, res, next) {
    try {
      // Validate request body
      const { error } = validateTeacherProfile(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Ensure the teacher ID matches the authenticated user's teacher ID
      if (req.user.teacher && req.user.teacher.teacherId !== req.body.teacherId) {
        return next(new AppError('You can only create a profile for yourself', 403));
      }

      const profileData = {
        ...req.body,
        teacherId: req.user.teacher.teacherId
      };
      
      const profile = await teacherProfileService.createProfile(profileData);
      
      res.status(201).json({
        status: 'success',
        data: {
          profile
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a teacher profile by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProfileById(req, res, next) {
    try {
      const { id } = req.params;
      
      const profile = await teacherProfileService.getProfileById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          profile
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a teacher profile by teacher ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProfileByTeacherId(req, res, next) {
    try {
      const { teacherId } = req.params;
      
      const profile = await teacherProfileService.getProfileByTeacherId(teacherId);
      
      res.status(200).json({
        status: 'success',
        data: {
          profile
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all teacher profiles with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllProfiles(req, res, next) {
    try {
      const { isFreelancer, profileVisibility, specializations, minRating } = req.query;
      
      const filters = {
        isFreelancer: isFreelancer === 'true',
        profileVisibility,
        specializations: specializations ? specializations.split(',') : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined
      };
      
      const profiles = await teacherProfileService.getAllProfiles(filters);
      
      res.status(200).json({
        status: 'success',
        results: profiles.length,
        data: {
          profiles
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a teacher profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateProfile(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateTeacherProfile(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the profile to check ownership
      const profile = await teacherProfileService.getProfileById(id);
      
      // Ensure the teacher ID matches the authenticated user's teacher ID
      if (req.user.teacher && req.user.teacher.teacherId !== profile.teacherId) {
        return next(new AppError('You can only update your own profile', 403));
      }
      
      const updatedProfile = await teacherProfileService.updateProfile(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          profile: updatedProfile
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a teacher profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteProfile(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the profile to check ownership
      const profile = await teacherProfileService.getProfileById(id);
      
      // Ensure the teacher ID matches the authenticated user's teacher ID
      if (req.user.teacher && req.user.teacher.teacherId !== profile.teacherId) {
        return next(new AppError('You can only delete your own profile', 403));
      }
      
      await teacherProfileService.deleteProfile(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update featured courses for a teacher profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateFeaturedCourses(req, res, next) {
    try {
      const { id } = req.params;
      const { courseIds } = req.body;
      
      if (!Array.isArray(courseIds)) {
        return next(new AppError('courseIds must be an array', 400));
      }
      
      // Get the profile to check ownership
      const profile = await teacherProfileService.getProfileById(id);
      
      // Ensure the teacher ID matches the authenticated user's teacher ID
      if (req.user.teacher && req.user.teacher.teacherId !== profile.teacherId) {
        return next(new AppError('You can only update your own profile', 403));
      }
      
      const updatedProfile = await teacherProfileService.updateFeaturedCourses(id, courseIds);
      
      res.status(200).json({
        status: 'success',
        data: {
          profile: updatedProfile
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = teacherProfileController;
