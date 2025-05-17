const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Exams', {
    examId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'exam_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
    classId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      field: 'class_id'
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'teacher_id'
      },
      field: 'teacher_id'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in minutes'
    },
    passingPercentage: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 60.00,
      field: 'passing_percentage'
    },
    totalPoints: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 100.00,
      field: 'total_points'
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_published'
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'exams',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "exams_pkey",
        unique: true,
        fields: [
          { name: "exam_id" },
        ]
      },
      {
        name: "idx_exams_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_exams_teacher_id",
        fields: [
          { name: "teacher_id" },
        ]
      },
      {
        name: "idx_exams_class_id",
        fields: [
          { name: "class_id" },
        ]
      }
    ]
  });
};
