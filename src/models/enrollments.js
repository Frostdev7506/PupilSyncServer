const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Enrollments', {
    enrollmentId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'enrollment_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      unique: "enrollments_student_id_course_id_key",
      field: 'student_id'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      unique: "enrollments_student_id_course_id_key",
      field: 'course_id'
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'enrollment_date'
    }
  }, {
    sequelize,
    tableName: 'enrollments',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "enrollments_pkey",
        unique: true,
        fields: [
          { name: "enrollment_id" },
        ]
      },
      {
        name: "enrollments_student_id_course_id_key",
        unique: true,
        fields: [
          { name: "student_id" },
          { name: "course_id" },
        ]
      },
      {
        name: "idx_enrollments_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_enrollments_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
    ]
  });
};
