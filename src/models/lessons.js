const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Lessons', {
    lessonId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'lesson_id'
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'order_number'
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'is_published'
    }
  }, {
    sequelize,
    tableName: 'lessons',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_lessons_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "lessons_pkey",
        unique: true,
        fields: [
          { name: "lesson_id" },
        ]
      },
    ]
  });
};
