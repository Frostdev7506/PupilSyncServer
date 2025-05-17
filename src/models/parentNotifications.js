const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ParentNotifications', {
    notificationId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'notification_id'
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'parents',
        key: 'parent_id'
      },
      field: 'parent_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      field: 'student_id'
    },
    notificationType: {
      type: DataTypes.ENUM(
        'grade_update', 
        'assignment_due', 
        'assignment_missing', 
        'exam_scheduled', 
        'attendance_alert', 
        'behavior_incident', 
        'teacher_message', 
        'course_announcement', 
        'payment_due', 
        'report_available'
      ),
      allowNull: false,
      field: 'notification_type'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    relatedEntityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'related_entity_type',
      comment: "Type of entity this notification relates to (e.g., 'assignment', 'exam')"
    },
    relatedEntityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_entity_id',
      comment: "ID of the related entity"
    },
    urgency: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'archived'),
      allowNull: false,
      defaultValue: 'unread'
    },
    isActionRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_action_required'
    },
    actionType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'action_type',
      comment: "Type of action required (e.g., 'approve', 'review', 'pay')"
    },
    actionTakenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'action_taken_at'
    },
    sentViaEmail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'sent_via_email'
    },
    sentViaSms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'sent_via_sms'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    }
  }, {
    sequelize,
    tableName: 'parent_notifications',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "parent_notifications_pkey",
        unique: true,
        fields: [
          { name: "notification_id" },
        ]
      },
      {
        name: "idx_parent_notifications_parent_id",
        fields: [
          { name: "parent_id" },
        ]
      },
      {
        name: "idx_parent_notifications_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_parent_notifications_notification_type",
        fields: [
          { name: "notification_type" },
        ]
      },
      {
        name: "idx_parent_notifications_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_parent_notifications_created_at",
        fields: [
          { name: "created_at" },
        ]
      }
    ]
  });
};
