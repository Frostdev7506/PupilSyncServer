const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ClassEnrollments', {
    classEnrollmentId: { // Optional: Use a surrogate key
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'class_enrollment_id'
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      // primaryKey: true, // Use if not using surrogate key above
      field: 'class_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      // primaryKey: true, // Use if not using surrogate key above
      field: 'student_id'
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'enrollment_date'
    }
    // Add other fields if needed, e.g., status ('active', 'withdrawn')
  }, {
    sequelize,
    tableName: 'class_enrollments',
    schema: 'public',
    timestamps: true, // Record when enrollment was created/updated
    paranoid: true, // Soft delete enrollments
    indexes: [
      // Index for the composite key if not using surrogate PK
      // {
      //   name: "class_enrollments_pkey",
      //   unique: true,
      //   fields: [ { name: "class_id" }, { name: "student_id" } ]
      // },
       {
        name: "class_enrollments_pkey_surrogate", // Index for surrogate key
        unique: true,
        fields: [ { name: "class_enrollment_id" } ]
      },
      {
        name: "idx_class_enrollments_class_id",
        fields: [ { name: "class_id" } ]
      },
      {
        name: "idx_class_enrollments_student_id",
        fields: [ { name: "student_id" } ]
      },
      // Unique constraint to prevent duplicate enrollments if using surrogate key
      {
        name: "class_enrollments_class_student_unique",
        unique: true,
        fields: [ { name: "class_id" }, { name: "student_id" } ]
      }
    ]
  });
};