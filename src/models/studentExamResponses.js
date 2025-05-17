const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('StudentExamResponses', {
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
        model: 'student_exam_attempts',
        key: 'attempt_id'
      },
      field: 'attempt_id'
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exam_questions',
        key: 'question_id'
      },
      field: 'question_id'
    },
    chosenAnswerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'exam_answers',
        key: 'answer_id'
      },
      field: 'chosen_answer_id',
      comment: 'For multiple_choice questions'
    },
    textResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'text_response',
      comment: 'For short_answer and fill_in_blank questions'
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
    maxScore: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      field: 'max_score'
    },
    gradedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'graded_by',
      comment: 'For manually graded responses'
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'graded_at'
    },
    gradingNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'grading_notes'
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'responded_at'
    }
  }, {
    sequelize,
    tableName: 'student_exam_responses',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "student_exam_responses_pkey",
        unique: true,
        fields: [
          { name: "response_id" },
        ]
      },
      {
        name: "idx_student_exam_responses_attempt_id",
        fields: [
          { name: "attempt_id" },
        ]
      },
      {
        name: "idx_student_exam_responses_question_id",
        fields: [
          { name: "question_id" },
        ]
      },
      {
        name: "idx_student_exam_responses_attempt_question",
        unique: true,
        fields: [
          { name: "attempt_id" },
          { name: "question_id" },
        ]
      }
    ]
  });
};
