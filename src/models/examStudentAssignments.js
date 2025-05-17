const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ExamStudentAssignments', {
    assignmentId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'assignment_id'
    },
    examId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'exam_id'
      },
      field: 'exam_id'
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
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'assigned_at'
    },
    assignedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'assigned_by_id'
    },
    customStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'custom_start_date',
      comment: 'Custom start date for this student, overrides exam start date'
    },
    customEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'custom_end_date',
      comment: 'Custom end date for this student, overrides exam end date'
    },
    customDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'custom_duration',
      comment: 'Custom duration in minutes for this student, overrides exam duration'
    },
    status: {
      type: DataTypes.ENUM('assigned', 'started', 'completed', 'missed'),
      allowNull: false,
      defaultValue: 'assigned'
    }
  }, {
    sequelize,
    tableName: 'exam_student_assignments',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "exam_student_assignments_pkey",
        unique: true,
        fields: [
          { name: "assignment_id" },
        ]
      },
      {
        name: "idx_exam_student_assignments_exam_id",
        fields: [
          { name: "exam_id" },
        ]
      },
      {
        name: "idx_exam_student_assignments_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_exam_student_assignments_exam_student",
        unique: true,
        fields: [
          { name: "exam_id" },
          { name: "student_id" },
        ]
      }
    ]
  });
};
