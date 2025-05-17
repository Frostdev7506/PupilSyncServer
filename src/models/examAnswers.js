const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ExamAnswers', {
    answerId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'answer_id'
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
    answerText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'answer_text'
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_correct'
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'order_number'
    }
  }, {
    sequelize,
    tableName: 'exam_answers',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "exam_answers_pkey",
        unique: true,
        fields: [
          { name: "answer_id" },
        ]
      },
      {
        name: "idx_exam_answers_question_id",
        fields: [
          { name: "question_id" },
        ]
      }
    ]
  });
};
