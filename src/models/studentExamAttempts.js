const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('StudentExamAttempts', {
    attemptId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'attempt_id'
    },
    assignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exam_student_assignments',
        key: 'assignment_id'
      },
      field: 'assignment_id'
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
    examId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'exam_id'
      },
      field: 'exam_id'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'started_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    score: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    maxScore: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      field: 'max_score'
    },
    percentage: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    passed: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'timed_out', 'submitted'),
      allowNull: false,
      defaultValue: 'in_progress'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'user_agent'
    }
  }, {
    sequelize,
    tableName: 'student_exam_attempts',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "student_exam_attempts_pkey",
        unique: true,
        fields: [
          { name: "attempt_id" },
        ]
      },
      {
        name: "idx_student_exam_attempts_assignment_id",
        fields: [
          { name: "assignment_id" },
        ]
      },
      {
        name: "idx_student_exam_attempts_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_student_exam_attempts_exam_id",
        fields: [
          { name: "exam_id" },
        ]
      }
    ]
  });
};
