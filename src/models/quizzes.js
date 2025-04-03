const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Quizzes', {
    quizId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'quiz_id'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      field: 'course_id'
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'lessons',
        key: 'lesson_id'
      },
      field: 'lesson_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'time_limit_minutes'
    }
  }, {
    sequelize,
    tableName: 'quizzes',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_quizzes_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_quizzes_lesson_id",
        fields: [
          { name: "lesson_id" },
        ]
      },
      {
        name: "quizzes_pkey",
        unique: true,
        fields: [
          { name: "quiz_id" },
        ]
      },
    ]
  });
};
