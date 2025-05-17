const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const parentAccessSettingsService = require('./parentAccessSettingsService');

const models = initModels(sequelize);
const { ParentNotifications, Parents, Students, Users } = models;

const parentNotificationService = {
  /**
   * Create a new parent notification
   * @param {Object} notificationData - The notification data
   * @returns {Promise<Object>} - The created notification
   */
  async createNotification(notificationData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if parent and student exist and are linked
      const parent = await Parents.findByPk(notificationData.parentId, { transaction });
      
      if (!parent) {
        await transaction.rollback();
        throw new AppError('Parent not found', 404);
      }
      
      const student = await Students.findByPk(notificationData.studentId, { transaction });
      
      if (!student) {
        await transaction.rollback();
        throw new AppError('Student not found', 404);
      }
      
      // Check if parent and student are linked
      const isLinked = await parent.hasStudent(student, { transaction });
      
      if (!isLinked) {
        await transaction.rollback();
        throw new AppError('Parent is not linked to this student', 400);
      }
      
      // Check if parent has access to this type of notification
      const notificationType = notificationData.notificationType;
      let accessFeature;
      
      switch (notificationType) {
        case 'grade':
          accessFeature = 'canAccessGrades';
          break;
        case 'attendance':
          accessFeature = 'canAccessAttendance';
          break;
        case 'behavior':
          accessFeature = 'canAccessBehavior';
          break;
        case 'assignment':
          accessFeature = 'canAccessAssignments';
          break;
        case 'exam':
          accessFeature = 'canAccessExams';
          break;
        default:
          accessFeature = null;
      }
      
      if (accessFeature) {
        const hasAccess = await parentAccessSettingsService.checkAccess(
          notificationData.parentId,
          notificationData.studentId,
          accessFeature
        );
        
        if (!hasAccess) {
          await transaction.rollback();
          throw new AppError(`Parent does not have access to ${notificationType} notifications`, 403);
        }
      }
      
      // Create the notification
      const notification = await ParentNotifications.create(notificationData, { transaction });
      
      await transaction.commit();
      
      return this.getNotificationById(notification.notificationId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a notification by ID
   * @param {number} notificationId - The notification ID
   * @returns {Promise<Object>} - The notification
   */
  async getNotificationById(notificationId) {
    const notification = await ParentNotifications.findByPk(notificationId, {
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

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return notification;
  },

  /**
   * Get all notifications for a parent
   * @param {number} parentId - The parent ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of notifications
   */
  async getParentNotifications(parentId, filters = {}) {
    const { studentId, notificationType, isRead, startDate, endDate, limit, offset } = filters;
    
    const whereClause = { parentId };
    
    if (studentId) {
      whereClause.studentId = studentId;
    }
    
    if (notificationType) {
      whereClause.notificationType = notificationType;
    }
    
    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const notifications = await ParentNotifications.findAll({
      where: whereClause,
      include: [
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    
    return notifications;
  },

  /**
   * Get all notifications for a student
   * @param {number} studentId - The student ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of notifications
   */
  async getStudentNotifications(studentId, filters = {}) {
    const { parentId, notificationType, isRead, startDate, endDate } = filters;
    
    const whereClause = { studentId };
    
    if (parentId) {
      whereClause.parentId = parentId;
    }
    
    if (notificationType) {
      whereClause.notificationType = notificationType;
    }
    
    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const notifications = await ParentNotifications.findAll({
      where: whereClause,
      include: [
        {
          model: Parents,
          as: 'parent',
          include: [{ model: Users, as: 'user' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return notifications;
  },

  /**
   * Update a notification
   * @param {number} notificationId - The notification ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated notification
   */
  async updateNotification(notificationId, updateData) {
    const notification = await ParentNotifications.findByPk(notificationId);
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    await notification.update(updateData);
    
    return this.getNotificationById(notificationId);
  },

  /**
   * Mark a notification as read
   * @param {number} notificationId - The notification ID
   * @returns {Promise<Object>} - The updated notification
   */
  async markAsRead(notificationId) {
    return this.updateNotification(notificationId, { isRead: true, readAt: new Date() });
  },

  /**
   * Mark all notifications as read for a parent
   * @param {number} parentId - The parent ID
   * @param {number} studentId - Optional student ID to filter by
   * @returns {Promise<number>} - Number of notifications updated
   */
  async markAllAsRead(parentId, studentId = null) {
    const whereClause = {
      parentId,
      isRead: false
    };
    
    if (studentId) {
      whereClause.studentId = studentId;
    }
    
    const [updatedCount] = await ParentNotifications.update(
      { isRead: true, readAt: new Date() },
      { where: whereClause }
    );
    
    return updatedCount;
  },

  /**
   * Delete a notification
   * @param {number} notificationId - The notification ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteNotification(notificationId) {
    const notification = await ParentNotifications.findByPk(notificationId);
    
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }
    
    await notification.destroy();
    
    return true;
  },

  /**
   * Get unread notification count for a parent
   * @param {number} parentId - The parent ID
   * @param {number} studentId - Optional student ID to filter by
   * @returns {Promise<number>} - Number of unread notifications
   */
  async getUnreadCount(parentId, studentId = null) {
    const whereClause = {
      parentId,
      isRead: false
    };
    
    if (studentId) {
      whereClause.studentId = studentId;
    }
    
    const count = await ParentNotifications.count({ where: whereClause });
    
    return count;
  }
};

module.exports = parentNotificationService;
