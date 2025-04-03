const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('StudentQuizResponses', {
    responseId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'response_id'
    },
    attemptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'student_quiz_attempts',
        key: 'attempt_id'
      },
      field: 'attempt_id'
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quiz_questions',
        key: 'question_id'
      },
      field: 'question_id'
    },
    chosenAnswerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'quiz_answers',
        key: 'answer_id'
      },
      field: 'chosen_answer_id'
    },
    shortAnswerText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'short_answer_text'
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'is_correct'
    },
    scoreAwarded: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'score_awarded'
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'responded_at'
    }
  }, {
    sequelize,
    tableName: 'student_quiz_responses',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_student_quiz_responses_attempt_id",
        fields: [
          { name: "attempt_id" },
        ]
      },
      {
        name: "idx_student_quiz_responses_question_id",
        fields: [
          { name: "question_id" },
        ]
      },
      {
        name: "student_quiz_responses_pkey",
        unique: true,
        fields: [
          { name: "response_id" },
        ]
      },
    ]
  });
};
