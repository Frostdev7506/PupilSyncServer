const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('StudentQuizAttempts', {
    attemptId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'attempt_id'
    },
    quizId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quizzes',
        key: 'quiz_id'
      },
      field: 'quiz_id'
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
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    }
  }, {
    sequelize,
    tableName: 'student_quiz_attempts',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_student_quiz_attempts_quiz_id",
        fields: [
          { name: "quiz_id" },
        ]
      },
      {
        name: "idx_student_quiz_attempts_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "student_quiz_attempts_pkey",
        unique: true,
        fields: [
          { name: "attempt_id" },
        ]
      },
    ]
  });
};
