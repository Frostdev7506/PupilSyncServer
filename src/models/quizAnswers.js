const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('QuizAnswers', {
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
        model: 'quiz_questions',
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
      allowNull: true,
      defaultValue: false,
      field: 'is_correct'
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'order_number'
    }
  }, {
    sequelize,
    tableName: 'quiz_answers',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_quiz_answers_question_id",
        fields: [
          { name: "question_id" },
        ]
      },
      {
        name: "quiz_answers_pkey",
        unique: true,
        fields: [
          { name: "answer_id" },
        ]
      },
    ]
  });
};
