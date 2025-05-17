const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('StudentProgressReports', {
    reportId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'report_id'
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
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      field: 'course_id',
      comment: "Course this report is for (if applicable)"
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      field: 'class_id',
      comment: "Class this report is for (if applicable)"
    },
    reportType: {
      type: DataTypes.ENUM('weekly', 'monthly', 'quarterly', 'semester', 'annual', 'custom'),
      allowNull: false,
      field: 'report_type'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'period_start'
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'period_end'
    },
    academicData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'academic_data',
      comment: "Academic performance data (grades, assessments, etc.)"
    },
    attendanceData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'attendance_data',
      comment: "Attendance statistics for the period"
    },
    behaviorData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'behavior_data',
      comment: "Behavior and conduct information"
    },
    skillsAssessment: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'skills_assessment',
      comment: "Assessment of specific skills and competencies"
    },
    teacherComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'teacher_comments'
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    goalsForNextPeriod: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'goals_for_next_period'
    },
    generatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'generated_by'
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'approved_by'
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at'
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'published'),
      allowNull: false,
      defaultValue: 'draft'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
    },
    parentViewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'parent_viewed_at'
    },
    studentViewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'student_viewed_at'
    },
    parentAcknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'parent_acknowledged_at'
    },
    parentFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'parent_feedback'
    }
  }, {
    sequelize,
    tableName: 'student_progress_reports',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "student_progress_reports_pkey",
        unique: true,
        fields: [
          { name: "report_id" },
        ]
      },
      {
        name: "idx_student_progress_reports_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_student_progress_reports_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_student_progress_reports_class_id",
        fields: [
          { name: "class_id" },
        ]
      },
      {
        name: "idx_student_progress_reports_period_end",
        fields: [
          { name: "period_end" },
        ]
      },
      {
        name: "idx_student_progress_reports_status",
        fields: [
          { name: "status" },
        ]
      }
    ]
  });
};
