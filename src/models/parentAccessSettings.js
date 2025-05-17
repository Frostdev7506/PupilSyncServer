const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ParentAccessSettings', {
    settingId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'setting_id'
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
    canViewGrades: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_view_grades'
    },
    canViewAttendance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_view_attendance'
    },
    canViewAssignments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_view_assignments'
    },
    canViewExams: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_view_exams'
    },
    canViewBehavior: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_view_behavior'
    },
    canViewCourseContent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_view_course_content'
    },
    canContactTeachers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_contact_teachers'
    },
    canApproveActivities: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'can_approve_activities',
      comment: "Whether parent approval is required for certain activities"
    },
    canManageEnrollment: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'can_manage_enrollment',
      comment: "Whether parent can enroll student in courses"
    },
    canManagePayments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_manage_payments'
    },
    receiveEmailNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'receive_email_notifications'
    },
    receiveSmsNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'receive_sms_notifications'
    },
    notificationPreferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'notification_preferences',
      comment: "Detailed notification settings"
    },
    lastUpdatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'last_updated_by'
    }
  }, {
    sequelize,
    tableName: 'parent_access_settings',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "parent_access_settings_pkey",
        unique: true,
        fields: [
          { name: "setting_id" },
        ]
      },
      {
        name: "idx_parent_access_settings_parent_id",
        fields: [
          { name: "parent_id" },
        ]
      },
      {
        name: "idx_parent_access_settings_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_parent_access_settings_parent_student",
        unique: true,
        fields: [
          { name: "parent_id" },
          { name: "student_id" },
        ]
      }
    ]
  });
};
