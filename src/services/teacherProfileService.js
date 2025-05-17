const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { TeacherProfiles, Teachers, Users, Courses } = models;

const teacherProfileService = {
  /**
   * Create a new teacher profile
   * @param {Object} profileData - The profile data
   * @returns {Promise<Object>} - The created profile
   */
  async createProfile(profileData) {
    try {
      // Check if profile already exists for this teacher
      const existingProfile = await TeacherProfiles.findOne({
        where: { teacherId: profileData.teacherId }
      });

      if (existingProfile) {
        throw new AppError('Profile already exists for this teacher', 400);
      }

      const profile = await TeacherProfiles.create(profileData);
      return profile;
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a teacher profile by ID
   * @param {number} profileId - The profile ID
   * @returns {Promise<Object>} - The profile
   */
  async getProfileById(profileId) {
    const profile = await TeacherProfiles.findByPk(profileId, {
      include: [
        {
          model: Teachers,
          as: 'teacher',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });

    if (!profile) {
      throw new AppError('Teacher profile not found', 404);
    }

    return profile;
  },

  /**
   * Get a teacher profile by teacher ID
   * @param {number} teacherId - The teacher ID
   * @returns {Promise<Object>} - The profile
   */
  async getProfileByTeacherId(teacherId) {
    const profile = await TeacherProfiles.findOne({
      where: { teacherId },
      include: [
        {
          model: Teachers,
          as: 'teacher',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });

    if (!profile) {
      throw new AppError('Teacher profile not found', 404);
    }

    return profile;
  },

  /**
   * Get all teacher profiles with optional filtering
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of profiles
   */
  async getAllProfiles(filters = {}) {
    const { isFreelancer, profileVisibility, specializations, minRating } = filters;
    
    const whereClause = {};
    
    if (isFreelancer !== undefined) {
      whereClause.isFreelancer = isFreelancer;
    }
    
    if (profileVisibility) {
      whereClause.profileVisibility = profileVisibility;
    }
    
    if (specializations && specializations.length > 0) {
      whereClause.specializations = {
        [Op.overlap]: specializations
      };
    }
    
    if (minRating) {
      whereClause.rating = {
        [Op.gte]: minRating
      };
    }
    
    const profiles = await TeacherProfiles.findAll({
      where: whereClause,
      include: [
        {
          model: Teachers,
          as: 'teacher',
          include: [{ model: Users, as: 'user' }]
        }
      ],
      order: [
        ['rating', 'DESC'],
        ['reviewCount', 'DESC']
      ]
    });
    
    return profiles;
  },

  /**
   * Update a teacher profile
   * @param {number} profileId - The profile ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated profile
   */
  async updateProfile(profileId, updateData) {
    const profile = await TeacherProfiles.findByPk(profileId);
    
    if (!profile) {
      throw new AppError('Teacher profile not found', 404);
    }
    
    await profile.update(updateData);
    
    return this.getProfileById(profileId);
  },

  /**
   * Delete a teacher profile
   * @param {number} profileId - The profile ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteProfile(profileId) {
    const profile = await TeacherProfiles.findByPk(profileId);
    
    if (!profile) {
      throw new AppError('Teacher profile not found', 404);
    }
    
    await profile.destroy();
    
    return true;
  },

  /**
   * Update featured courses for a teacher profile
   * @param {number} profileId - The profile ID
   * @param {Array<number>} courseIds - Array of course IDs to feature
   * @returns {Promise<Object>} - The updated profile
   */
  async updateFeaturedCourses(profileId, courseIds) {
    const profile = await TeacherProfiles.findByPk(profileId);
    
    if (!profile) {
      throw new AppError('Teacher profile not found', 404);
    }
    
    // Verify all courses exist and belong to the teacher
    const teacherId = profile.teacherId;
    const courses = await Courses.findAll({
      where: {
        courseId: {
          [Op.in]: courseIds
        },
        teacherId
      }
    });
    
    if (courses.length !== courseIds.length) {
      throw new AppError('Some courses do not exist or do not belong to this teacher', 400);
    }
    
    await profile.update({ featuredCourses: courseIds });
    
    return this.getProfileById(profileId);
  }
};

module.exports = teacherProfileService;
