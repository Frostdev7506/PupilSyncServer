const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('QuizQuestions', {
    questionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'question_id'
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
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'question_text'
    },
    questionType: {
      type: DataTypes.ENUM("multiple_choice","true_false","short_answer"),
      allowNull: false,
      field: 'question_type'
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'order_number'
    },
    points: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 1.00
    }
  }, {
    sequelize,
    tableName: 'quiz_questions',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_quiz_questions_quiz_id",
        fields: [
          { name: "quiz_id" },
        ]
      },
      {
        name: "quiz_questions_pkey",
        unique: true,
        fields: [
          { name: "question_id" },
        ]
      },
    ]
  });
};
