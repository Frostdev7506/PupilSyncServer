const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ExamQuestions', {
    questionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'question_id'
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
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'question_text'
    },
    questionType: {
      type: DataTypes.ENUM('multiple_choice', 'short_answer', 'fill_in_blank'),
      allowNull: false,
      field: 'question_type'
    },
    points: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 1.00
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'order_number'
    },
    correctAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'correct_answer',
      comment: 'For short_answer and fill_in_blank questions'
    },
    caseSensitive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'case_sensitive',
      comment: 'For short_answer and fill_in_blank questions'
    },
    allowPartialMatch: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allow_partial_match',
      comment: 'For short_answer and fill_in_blank questions'
    }
  }, {
    sequelize,
    tableName: 'exam_questions',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "exam_questions_pkey",
        unique: true,
        fields: [
          { name: "question_id" },
        ]
      },
      {
        name: "idx_exam_questions_exam_id",
        fields: [
          { name: "exam_id" },
        ]
      }
    ]
  });
};
