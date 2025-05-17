const parentAccessSettingsService = require('../services/parentAccessSettingsService');
const AppError = require('../utils/errors/AppError');
const { validateParentAccessSettings } = require('../utils/validators/parentAccessSettingsValidator');

const parentAccessSettingsController = {
  /**
   * Create or update parent access settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createOrUpdateSettings(req, res, next) {
    try {
      // Validate request body
      const { error } = validateParentAccessSettings(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Check if user is authorized to update these settings
      if (req.user.role !== 'admin' && req.user.parent && req.user.parent.parentId !== req.body.parentId) {
        return next(new AppError('You can only update your own access settings', 403));
      }
      
      const settings = await parentAccessSettingsService.createOrUpdateSettings(req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          settings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get settings by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSettingsById(req, res, next) {
    try {
      const { id } = req.params;
      
      const settings = await parentAccessSettingsService.getSettingsById(id);
      
      // Check if user is authorized to view these settings
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.parent && req.user.parent.parentId !== settings.parentId) {
          return next(new AppError('You can only view your own access settings', 403));
        }
        
        if (req.user.student && req.user.student.studentId !== settings.studentId) {
          return next(new AppError('You can only view access settings for your account', 403));
        }
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          settings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get settings for a parent-student relationship
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSettingsByParentAndStudent(req, res, next) {
    try {
      const { parentId, studentId } = req.params;
      
      // Check if user is authorized to view these settings
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.parent && req.user.parent.parentId !== parseInt(parentId)) {
          return next(new AppError('You can only view your own access settings', 403));
        }
        
        if (req.user.student && req.user.student.studentId !== parseInt(studentId)) {
          return next(new AppError('You can only view access settings for your account', 403));
        }
      }
      
      const settings = await parentAccessSettingsService.getSettingsByParentAndStudent(parentId, studentId);
      
      res.status(200).json({
        status: 'success',
        data: {
          settings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all settings for a parent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSettingsByParent(req, res, next) {
    try {
      const { parentId } = req.params;
      
      // Check if user is authorized to view these settings
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.parent && req.user.parent.parentId !== parseInt(parentId)) {
        return next(new AppError('You can only view your own access settings', 403));
      }
      
      const settings = await parentAccessSettingsService.getSettingsByParent(parentId);
      
      res.status(200).json({
        status: 'success',
        results: settings.length,
        data: {
          settings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all settings for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSettingsByStudent(req, res, next) {
    try {
      const { studentId } = req.params;
      
      // Check if user is authorized to view these settings
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.student && req.user.student.studentId !== parseInt(studentId)) {
        return next(new AppError('You can only view access settings for your account', 403));
      }
      
      const settings = await parentAccessSettingsService.getSettingsByStudent(studentId);
      
      res.status(200).json({
        status: 'success',
        results: settings.length,
        data: {
          settings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteSettings(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the settings to check ownership
      const settings = await parentAccessSettingsService.getSettingsById(id);
      
      // Check if user is authorized to delete these settings
      if (req.user.role !== 'admin' && req.user.parent && req.user.parent.parentId !== settings.parentId) {
        return next(new AppError('You can only delete your own access settings', 403));
      }
      
      await parentAccessSettingsService.deleteSettings(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Check if a parent has access to a specific feature for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async checkAccess(req, res, next) {
    try {
      const { parentId, studentId, feature } = req.params;
      
      // Check if user is authorized to check these settings
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.parent && req.user.parent.parentId !== parseInt(parentId)) {
          return next(new AppError('You can only check your own access settings', 403));
        }
      }
      
      const hasAccess = await parentAccessSettingsService.checkAccess(parentId, studentId, feature);
      
      res.status(200).json({
        status: 'success',
        data: {
          hasAccess
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = parentAccessSettingsController;
