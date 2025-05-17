const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const parentStudentUtil = require('../utils/parentStudentUtil');

const models = initModels(sequelize);
const { ParentAccessSettings, Parents, Students, Users } = models;

const parentAccessSettingsService = {
  /**
   * Create or update parent access settings
   * @param {Object} settingsData - The settings data
   * @returns {Promise<Object>} - The created or updated settings
   */
  async createOrUpdateSettings(settingsData) {
    const transaction = await sequelize.transaction();

    try {
      // Check if parent and student exist and are linked
      const parent = await Parents.findByPk(settingsData.parentId, { transaction });

      if (!parent) {
        await transaction.rollback();
        throw new AppError('Parent not found', 404);
      }

      const student = await Students.findByPk(settingsData.studentId, { transaction });

      if (!student) {
        await transaction.rollback();
        throw new AppError('Student not found', 404);
      }

      // Check if parent and student are linked
      const isLinked = await parentStudentUtil.isParentLinkedToStudent(
        parent.parentId,
        student.studentId,
        { transaction }
      );

      if (!isLinked) {
        await transaction.rollback();
        throw new AppError('Parent is not linked to this student', 400);
      }

      // Check if settings already exist
      const existingSettings = await ParentAccessSettings.findOne({
        where: {
          parentId: settingsData.parentId,
          studentId: settingsData.studentId
        },
        transaction
      });

      let settings;

      if (existingSettings) {
        // Update existing settings
        settings = await existingSettings.update(settingsData, { transaction });
      } else {
        // Create new settings
        settings = await ParentAccessSettings.create(settingsData, { transaction });
      }

      await transaction.commit();

      return this.getSettingsById(settings.settingId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get settings by ID
   * @param {number} settingId - The setting ID
   * @returns {Promise<Object>} - The settings
   */
  async getSettingsById(settingId) {
    const settings = await ParentAccessSettings.findByPk(settingId, {
      include: [
        {
          model: Parents,
          as: 'parent',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });

    if (!settings) {
      throw new AppError('Parent access settings not found', 404);
    }

    return settings;
  },

  /**
   * Get settings for a parent-student relationship
   * @param {number} parentId - The parent ID
   * @param {number} studentId - The student ID
   * @returns {Promise<Object>} - The settings
   */
  async getSettingsByParentAndStudent(parentId, studentId) {
    const settings = await ParentAccessSettings.findOne({
      where: {
        parentId,
        studentId
      },
      include: [
        {
          model: Parents,
          as: 'parent',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });

    if (!settings) {
      throw new AppError('Parent access settings not found', 404);
    }

    return settings;
  },

  /**
   * Get all settings for a parent
   * @param {number} parentId - The parent ID
   * @returns {Promise<Array>} - Array of settings
   */
  async getSettingsByParent(parentId) {
    const settings = await ParentAccessSettings.findAll({
      where: { parentId },
      include: [
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });

    return settings;
  },

  /**
   * Get all settings for a student
   * @param {number} studentId - The student ID
   * @returns {Promise<Array>} - Array of settings
   */
  async getSettingsByStudent(studentId) {
    const settings = await ParentAccessSettings.findAll({
      where: { studentId },
      include: [
        {
          model: Parents,
          as: 'parent',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });

    return settings;
  },

  /**
   * Delete settings
   * @param {number} settingId - The setting ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteSettings(settingId) {
    const settings = await ParentAccessSettings.findByPk(settingId);

    if (!settings) {
      throw new AppError('Parent access settings not found', 404);
    }

    await settings.destroy();

    return true;
  },

  /**
   * Check if a parent has access to a specific feature for a student
   * @param {number} parentId - The parent ID
   * @param {number} studentId - The student ID
   * @param {string} feature - The feature to check
   * @returns {Promise<boolean>} - True if parent has access
   */
  async checkAccess(parentId, studentId, feature) {
    try {
      const settings = await ParentAccessSettings.findOne({
        where: {
          parentId,
          studentId
        }
      });

      if (!settings) {
        return false;
      }

      // Check if the feature exists in the settings
      if (settings[feature] === undefined) {
        throw new AppError(`Invalid feature: ${feature}`, 400);
      }

      return settings[feature];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      return false;
    }
  }
};

module.exports = parentAccessSettingsService;
