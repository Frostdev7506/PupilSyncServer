const parentNotificationService = require('../services/parentNotificationService');
const AppError = require('../utils/errors/AppError');
const { validateParentNotification } = require('../utils/validators/parentNotificationValidator');

const parentNotificationController = {
  /**
   * Create a new parent notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createNotification(req, res, next) {
    try {
      // Validate request body
      const { error } = validateParentNotification(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Only teachers and admins can create notifications
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return next(new AppError('Only teachers and administrators can create notifications', 403));
      }
      
      const notification = await parentNotificationService.createNotification(req.body);
      
      res.status(201).json({
        status: 'success',
        data: {
          notification
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a notification by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getNotificationById(req, res, next) {
    try {
      const { id } = req.params;
      
      const notification = await parentNotificationService.getNotificationById(id);
      
      // Check if user is authorized to view this notification
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.parent && req.user.parent.parentId !== notification.parentId) {
          return next(new AppError('You can only view your own notifications', 403));
        }
        
        if (req.user.student && req.user.student.studentId !== notification.studentId) {
          return next(new AppError('You can only view notifications for your account', 403));
        }
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          notification
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all notifications for a parent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getParentNotifications(req, res, next) {
    try {
      const { parentId } = req.params;
      const { studentId, notificationType, isRead, startDate, endDate, limit, offset } = req.query;
      
      // Check if user is authorized to view these notifications
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.parent && req.user.parent.parentId !== parseInt(parentId)) {
        return next(new AppError('You can only view your own notifications', 403));
      }
      
      const filters = {
        studentId: studentId ? parseInt(studentId) : undefined,
        notificationType,
        isRead: isRead === 'true',
        startDate,
        endDate,
        limit,
        offset
      };
      
      const notifications = await parentNotificationService.getParentNotifications(parentId, filters);
      
      res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: {
          notifications
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all notifications for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentNotifications(req, res, next) {
    try {
      const { studentId } = req.params;
      const { parentId, notificationType, isRead, startDate, endDate } = req.query;
      
      // Check if user is authorized to view these notifications
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.student && req.user.student.studentId !== parseInt(studentId)) {
          return next(new AppError('You can only view notifications for your account', 403));
        }
        
        if (req.user.parent && parentId && req.user.parent.parentId !== parseInt(parentId)) {
          return next(new AppError('You can only view your own notifications', 403));
        }
      }
      
      const filters = {
        parentId: parentId ? parseInt(parentId) : undefined,
        notificationType,
        isRead: isRead === 'true',
        startDate,
        endDate
      };
      
      const notifications = await parentNotificationService.getStudentNotifications(studentId, filters);
      
      res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: {
          notifications
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateNotification(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateParentNotification(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the notification to check ownership
      const notification = await parentNotificationService.getNotificationById(id);
      
      // Check if user is authorized to update this notification
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.parent && req.user.parent.parentId !== notification.parentId) {
        return next(new AppError('You can only update your own notifications', 403));
      }
      
      // Parents can only update isRead status
      if (req.user.parent) {
        const allowedFields = ['isRead'];
        const requestedFields = Object.keys(req.body);
        
        const hasDisallowedFields = requestedFields.some(field => !allowedFields.includes(field));
        if (hasDisallowedFields) {
          return next(new AppError('You can only update the read status', 403));
        }
      }
      
      const updatedNotification = await parentNotificationService.updateNotification(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          notification: updatedNotification
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark a notification as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the notification to check ownership
      const notification = await parentNotificationService.getNotificationById(id);
      
      // Check if user is authorized to update this notification
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.parent && req.user.parent.parentId !== notification.parentId) {
        return next(new AppError('You can only update your own notifications', 403));
      }
      
      const updatedNotification = await parentNotificationService.markAsRead(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          notification: updatedNotification
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark all notifications as read for a parent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async markAllAsRead(req, res, next) {
    try {
      const { parentId } = req.params;
      const { studentId } = req.query;
      
      // Check if user is authorized to update these notifications
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.parent && req.user.parent.parentId !== parseInt(parentId)) {
        return next(new AppError('You can only update your own notifications', 403));
      }
      
      const updatedCount = await parentNotificationService.markAllAsRead(
        parentId,
        studentId ? parseInt(studentId) : null
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          updatedCount
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a notification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the notification to check ownership
      const notification = await parentNotificationService.getNotificationById(id);
      
      // Check if user is authorized to delete this notification
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.parent && req.user.parent.parentId !== notification.parentId) {
        return next(new AppError('You can only delete your own notifications', 403));
      }
      
      await parentNotificationService.deleteNotification(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unread notification count for a parent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUnreadCount(req, res, next) {
    try {
      const { parentId } = req.params;
      const { studentId } = req.query;
      
      // Check if user is authorized to view these notifications
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.parent && req.user.parent.parentId !== parseInt(parentId)) {
        return next(new AppError('You can only view your own notifications', 403));
      }
      
      const count = await parentNotificationService.getUnreadCount(
        parentId,
        studentId ? parseInt(studentId) : null
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          count
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = parentNotificationController;
