const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Submissions', {
    submissionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'submission_id'
    },
    assignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assignments',
        key: 'assignment_id'
      },
      unique: "submissions_assignment_id_student_id_key",
      field: 'assignment_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      unique: "submissions_assignment_id_student_id_key",
      field: 'student_id'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'submitted_at'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    grade: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'graded_at'
    },
    graderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'grader_id'
    }
  }, {
    sequelize,
    tableName: 'submissions',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_submissions_assignment_id",
        fields: [
          { name: "assignment_id" },
        ]
      },
      {
        name: "idx_submissions_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "submissions_assignment_id_student_id_key",
        unique: true,
        fields: [
          { name: "assignment_id" },
          { name: "student_id" },
        ]
      },
      {
        name: "submissions_pkey",
        unique: true,
        fields: [
          { name: "submission_id" },
        ]
      },
    ]
  });
};
