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
  Messages,
  ParentTeacherConferences,
  ParentNotifications,
  SchoolAnnouncements
} = models;

const parentCommunicationService = {
  /**
   * Send a message from a parent to a teacher
   * @param {Object} messageData - The message data
   * @returns {Promise<Object>} - The created message
   */
  async sendMessageToTeacher(messageData) {
    const transaction = await sequelize.transaction();

    try {
      const { parentId, teacherId, studentId, subject, content } = messageData;

      // Check if parent is linked to student
      if (studentId) {
        const isLinked = await parentStudentUtil.isParentLinkedToStudent(parentId, studentId, { transaction });

        if (!isLinked) {
          await transaction.rollback();
          throw new AppError('Parent is not linked to this student', 403);
        }

        // Check if parent has access to contact teachers
        const hasAccess = await parentAccessSettingsService.checkAccess(parentId, studentId, 'canContactTeachers');

        if (!hasAccess) {
          await transaction.rollback();
          throw new AppError('You do not have permission to contact teachers for this student', 403);
        }
      }

      // Get parent and teacher users
      const parent = await Parents.findByPk(parentId, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email']
          }
        ],
        transaction
      });

      if (!parent) {
        await transaction.rollback();
        throw new AppError('Parent not found', 404);
      }

      const teacher = await Teachers.findByPk(teacherId, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email']
          }
        ],
        transaction
      });

      if (!teacher) {
        await transaction.rollback();
        throw new AppError('Teacher not found', 404);
      }

      // Create the message
      const message = await Messages.create({
        senderId: parent.user.userId,
        receiverId: teacher.user.userId,
        subject,
        content,
        relatedEntityType: studentId ? 'student' : null,
        relatedEntityId: studentId || null,
        sentAt: new Date()
      }, { transaction });

      await transaction.commit();

      // Return the message with sender and receiver details
      return {
        ...message.toJSON(),
        sender: parent.user,
        receiver: teacher.user,
        student: studentId ? { studentId } : null
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error sending message to teacher: ${error.message}`, 500);
    }
  },

  /**
   * Get messages between a parent and teachers
   * @param {number} parentId - The parent ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The messages
   */
  async getParentMessages(parentId, filters = {}) {
    try {
      const { teacherId, studentId, startDate, endDate, unreadOnly } = filters;

      // Get parent user
      const parent = await Parents.findByPk(parentId, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email']
          }
        ]
      });

      if (!parent) {
        throw new AppError('Parent not found', 404);
      }

      // Build the where clause
      const whereClause = {
        [Op.or]: [
          { senderId: parent.user.userId },
          { receiverId: parent.user.userId }
        ]
      };

      if (teacherId) {
        const teacher = await Teachers.findByPk(teacherId, {
          include: [
            {
              model: Users,
              as: 'user',
              attributes: ['userId']
            }
          ]
        });

        if (!teacher) {
          throw new AppError('Teacher not found', 404);
        }

        whereClause[Op.or] = [
          { senderId: parent.user.userId, receiverId: teacher.user.userId },
          { senderId: teacher.user.userId, receiverId: parent.user.userId }
        ];
      }

      if (studentId) {
        whereClause.relatedEntityType = 'student';
        whereClause.relatedEntityId = studentId;
      }

      if (startDate && endDate) {
        whereClause.sentAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else if (startDate) {
        whereClause.sentAt = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.sentAt = {
          [Op.lte]: new Date(endDate)
        };
      }

      if (unreadOnly) {
        whereClause.readAt = null;
        whereClause.receiverId = parent.user.userId;
      }

      // Get messages
      const messages = await Messages.findAll({
        where: whereClause,
        include: [
          {
            model: Users,
            as: 'sender',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
          },
          {
            model: Users,
            as: 'receiver',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
          }
        ],
        order: [['sentAt', 'DESC']]
      });

      // Group messages by conversation
      const conversations = {};

      messages.forEach(message => {
        const otherUserId = message.senderId === parent.user.userId ?
          message.receiverId : message.senderId;

        if (!conversations[otherUserId]) {
          const otherUser = message.senderId === parent.user.userId ?
            message.receiver : message.sender;

          conversations[otherUserId] = {
            otherUser,
            messages: [],
            unreadCount: 0,
            lastMessage: null
          };
        }

        conversations[otherUserId].messages.push(message);

        if (!message.readAt && message.receiverId === parent.user.userId) {
          conversations[otherUserId].unreadCount++;
        }

        if (!conversations[otherUserId].lastMessage ||
            new Date(message.sentAt) > new Date(conversations[otherUserId].lastMessage.sentAt)) {
          conversations[otherUserId].lastMessage = message;
        }
      });

      return Object.values(conversations);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving parent messages: ${error.message}`, 500);
    }
  },

  /**
   * Mark a message as read
   * @param {number} messageId - The message ID
   * @param {number} userId - The user ID marking the message as read
   * @returns {Promise<Object>} - The updated message
   */
  async markMessageAsRead(messageId, userId) {
    try {
      const message = await Messages.findByPk(messageId);

      if (!message) {
        throw new AppError('Message not found', 404);
      }

      // Check if user is the receiver
      if (message.receiverId !== userId) {
        throw new AppError('You can only mark messages sent to you as read', 403);
      }

      // Update the message
      await message.update({
        readAt: new Date()
      });

      return message;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error marking message as read: ${error.message}`, 500);
    }
  },

  /**
   * Schedule a parent-teacher conference
   * @param {Object} conferenceData - The conference data
   * @returns {Promise<Object>} - The created conference
   */
  async scheduleConference(conferenceData) {
    const transaction = await sequelize.transaction();

    try {
      const { parentId, teacherId, studentId, date, startTime, endTime, format, topic, notes } = conferenceData;

      // Check if parent is linked to student
      const isLinked = await parentStudentUtil.isParentLinkedToStudent(parentId, studentId, { transaction });

      if (!isLinked) {
        await transaction.rollback();
        throw new AppError('Parent is not linked to this student', 403);
      }

      // Check if parent has access to contact teachers
      const hasAccess = await parentAccessSettingsService.checkAccess(parentId, studentId, 'canContactTeachers');

      if (!hasAccess) {
        await transaction.rollback();
        throw new AppError('You do not have permission to schedule conferences for this student', 403);
      }

      // Check for scheduling conflicts
      const conflictingConferences = await ParentTeacherConferences.findAll({
        where: {
          teacherId,
          date,
          [Op.or]: [
            {
              startTime: { [Op.lt]: endTime },
              endTime: { [Op.gt]: startTime }
            }
          ]
        },
        transaction
      });

      if (conflictingConferences.length > 0) {
        await transaction.rollback();
        throw new AppError('The selected time slot conflicts with an existing conference', 400);
      }

      // Create the conference
      const conference = await ParentTeacherConferences.create({
        parentId,
        teacherId,
        studentId,
        date,
        startTime,
        endTime,
        format,
        topic,
        notes,
        status: 'pending',
        createdBy: 'parent'
      }, { transaction });

      // Create notification for teacher
      await ParentNotifications.create({
        parentId,
        studentId,
        notificationType: 'conference_request',
        title: 'New Conference Request',
        content: `A parent has requested a conference on ${date} from ${startTime} to ${endTime}`,
        relatedEntityType: 'conference',
        relatedEntityId: conference.conferenceId,
        urgency: 'medium',
        status: 'unread',
        isActionRequired: true,
        actionType: 'respond'
      }, { transaction });

      await transaction.commit();

      return conference;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error scheduling conference: ${error.message}`, 500);
    }
  },

  /**
   * Get parent-teacher conferences
   * @param {number} parentId - The parent ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The conferences
   */
  async getParentConferences(parentId, filters = {}) {
    try {
      const { teacherId, studentId, status, upcoming } = filters;

      // Build the where clause
      const whereClause = { parentId };

      if (teacherId) {
        whereClause.teacherId = teacherId;
      }

      if (studentId) {
        whereClause.studentId = studentId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (upcoming) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        whereClause.date = {
          [Op.gte]: today
        };
      }

      // Get conferences
      const conferences = await ParentTeacherConferences.findAll({
        where: whereClause,
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
            model: Teachers,
            as: 'teacher',
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
          }
        ],
        order: [['date', 'ASC'], ['startTime', 'ASC']]
      });

      return conferences;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving parent conferences: ${error.message}`, 500);
    }
  },

  /**
   * Update a parent-teacher conference
   * @param {number} conferenceId - The conference ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated conference
   */
  async updateConference(conferenceId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const conference = await ParentTeacherConferences.findByPk(conferenceId, { transaction });

      if (!conference) {
        await transaction.rollback();
        throw new AppError('Conference not found', 404);
      }

      // Check if user is authorized to update this conference
      if (updateData.parentId && conference.parentId !== updateData.parentId) {
        await transaction.rollback();
        throw new AppError('You can only update your own conferences', 403);
      }

      // If changing date/time, check for conflicts
      if ((updateData.date && updateData.date !== conference.date) ||
          (updateData.startTime && updateData.startTime !== conference.startTime) ||
          (updateData.endTime && updateData.endTime !== conference.endTime)) {

        const date = updateData.date || conference.date;
        const startTime = updateData.startTime || conference.startTime;
        const endTime = updateData.endTime || conference.endTime;

        const conflictingConferences = await ParentTeacherConferences.findAll({
          where: {
            teacherId: conference.teacherId,
            date,
            conferenceId: { [Op.ne]: conferenceId },
            [Op.or]: [
              {
                startTime: { [Op.lt]: endTime },
                endTime: { [Op.gt]: startTime }
              }
            ]
          },
          transaction
        });

        if (conflictingConferences.length > 0) {
          await transaction.rollback();
          throw new AppError('The selected time slot conflicts with an existing conference', 400);
        }
      }

      // Update the conference
      await conference.update(updateData, { transaction });

      // Create notification for teacher if parent is rescheduling
      if ((updateData.date && updateData.date !== conference.date) ||
          (updateData.startTime && updateData.startTime !== conference.startTime) ||
          (updateData.endTime && updateData.endTime !== conference.endTime)) {

        await ParentNotifications.create({
          parentId: conference.parentId,
          studentId: conference.studentId,
          notificationType: 'conference_update',
          title: 'Conference Rescheduled',
          content: `A parent has rescheduled a conference to ${updateData.date || conference.date} from ${updateData.startTime || conference.startTime} to ${updateData.endTime || conference.endTime}`,
          relatedEntityType: 'conference',
          relatedEntityId: conference.conferenceId,
          urgency: 'medium',
          status: 'unread',
          isActionRequired: true,
          actionType: 'acknowledge'
        }, { transaction });
      }

      await transaction.commit();

      // Return the updated conference with associations
      return ParentTeacherConferences.findByPk(conferenceId, {
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
            model: Teachers,
            as: 'teacher',
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
          }
        ]
      });
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating conference: ${error.message}`, 500);
    }
  },

  /**
   * Cancel a parent-teacher conference
   * @param {number} conferenceId - The conference ID
   * @param {number} parentId - The parent ID
   * @param {string} reason - The cancellation reason
   * @returns {Promise<Object>} - The cancelled conference
   */
  async cancelConference(conferenceId, parentId, reason) {
    const transaction = await sequelize.transaction();

    try {
      const conference = await ParentTeacherConferences.findByPk(conferenceId, { transaction });

      if (!conference) {
        await transaction.rollback();
        throw new AppError('Conference not found', 404);
      }

      // Check if user is authorized to cancel this conference
      if (conference.parentId !== parentId) {
        await transaction.rollback();
        throw new AppError('You can only cancel your own conferences', 403);
      }

      // Update the conference
      await conference.update({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: 'parent',
        cancelledAt: new Date()
      }, { transaction });

      // Create notification for teacher
      await ParentNotifications.create({
        parentId: conference.parentId,
        studentId: conference.studentId,
        notificationType: 'conference_cancelled',
        title: 'Conference Cancelled',
        content: `A parent has cancelled a conference scheduled for ${conference.date} from ${conference.startTime} to ${conference.endTime}. Reason: ${reason}`,
        relatedEntityType: 'conference',
        relatedEntityId: conference.conferenceId,
        urgency: 'medium',
        status: 'unread',
        isActionRequired: false
      }, { transaction });

      await transaction.commit();

      return conference;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error cancelling conference: ${error.message}`, 500);
    }
  },

  /**
   * Get school announcements for a parent
   * @param {number} parentId - The parent ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The announcements
   */
  async getSchoolAnnouncements(parentId, filters = {}) {
    try {
      const { startDate, endDate, unreadOnly } = filters;

      // Get parent with linked students
      const parent = await Parents.findByPk(parentId, {
        include: [
          {
            model: Students,
            as: 'studentIdStudents',
            through: { attributes: [] }
          }
        ]
      });

      if (!parent) {
        throw new AppError('Parent not found', 404);
      }

      // Get student IDs and institution IDs
      const studentIds = parent.studentIdStudents.map(student => student.studentId);
      const institutionIds = [...new Set(parent.studentIdStudents
        .filter(student => student.institutionId)
        .map(student => student.institutionId))];

      // Build the where clause
      const whereClause = {
        [Op.or]: [
          { targetAudience: 'all_parents' },
          {
            targetAudience: 'specific_parents',
            targetParentIds: { [Op.contains]: [parentId] }
          },
          {
            targetAudience: 'institution_parents',
            targetInstitutionIds: { [Op.overlap]: institutionIds }
          },
          {
            targetAudience: 'student_parents',
            targetStudentIds: { [Op.overlap]: studentIds }
          }
        ]
      };

      if (startDate && endDate) {
        whereClause.publishedAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else if (startDate) {
        whereClause.publishedAt = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.publishedAt = {
          [Op.lte]: new Date(endDate)
        };
      }

      // Get announcements
      const announcements = await SchoolAnnouncements.findAll({
        where: whereClause,
        include: [
          {
            model: Users,
            as: 'publisher',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
          }
        ],
        order: [['publishedAt', 'DESC']]
      });

      // If unreadOnly, filter announcements that have been read
      if (unreadOnly) {
        // Get read announcement IDs
        const readAnnouncementIds = await ParentNotifications.findAll({
          where: {
            parentId,
            notificationType: 'announcement',
            status: 'read'
          },
          attributes: ['relatedEntityId']
        }).then(notifications => notifications.map(n => n.relatedEntityId));

        return announcements.filter(a => !readAnnouncementIds.includes(a.announcementId));
      }

      return announcements;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving school announcements: ${error.message}`, 500);
    }
  },

  /**
   * Acknowledge a school announcement
   * @param {number} announcementId - The announcement ID
   * @param {number} parentId - The parent ID
   * @returns {Promise<Object>} - The acknowledgement result
   */
  async acknowledgeAnnouncement(announcementId, parentId) {
    const transaction = await sequelize.transaction();

    try {
      // Check if announcement exists
      const announcement = await SchoolAnnouncements.findByPk(announcementId, { transaction });

      if (!announcement) {
        await transaction.rollback();
        throw new AppError('Announcement not found', 404);
      }

      // Check if parent has already acknowledged this announcement
      const existingNotification = await ParentNotifications.findOne({
        where: {
          parentId,
          notificationType: 'announcement',
          relatedEntityType: 'announcement',
          relatedEntityId: announcementId
        },
        transaction
      });

      if (existingNotification) {
        // Update existing notification
        await existingNotification.update({
          status: 'read',
          actionTakenAt: new Date()
        }, { transaction });
      } else {
        // Create new notification record
        await ParentNotifications.create({
          parentId,
          studentId: null,
          notificationType: 'announcement',
          title: announcement.title,
          content: announcement.content,
          relatedEntityType: 'announcement',
          relatedEntityId: announcementId,
          urgency: 'low',
          status: 'read',
          isActionRequired: false,
          actionTakenAt: new Date()
        }, { transaction });
      }

      await transaction.commit();

      return { success: true, message: 'Announcement acknowledged successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error acknowledging announcement: ${error.message}`, 500);
    }
  }
};

module.exports = parentCommunicationService;
