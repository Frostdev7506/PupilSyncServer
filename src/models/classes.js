const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Classes', {
    classId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'class_id'
    },
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions', // Links to the school/institution
        key: 'institution_id'
      },
      field: 'institution_id'
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Assuming a class must have a primary teacher
      references: {
        model: 'teachers', // Links to the teacher responsible
        key: 'teacher_id'
      },
      field: 'teacher_id'
    },
    // Optional: Link to a course definition if classes follow a specific curriculum
    // courseId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: 'courses',
    //     key: 'course_id'
    //   },
    //   field: 'course_id'
    // },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false, // e.g., "Grade 9 Math - Section A"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true // Optional details about the class
    },
    // Add other relevant fields like term, schedule, room number etc. if needed
    // term: { type: DataTypes.STRING(100), allowNull: true },
    // schedule: { type: DataTypes.STRING(255), allowNull: true },

  }, {
    sequelize,
    tableName: 'classes',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "classes_pkey",
        unique: true,
        fields: [ { name: "class_id" } ]
      },
      {
        name: "idx_classes_institution_id",
        fields: [ { name: "institution_id" } ]
      },
      {
        name: "idx_classes_teacher_id",
        fields: [ { name: "teacher_id" } ]
      },
      // Add index if you include courseId
      // {
      //   name: "idx_classes_course_id",
      //   fields: [ { name: "course_id" } ]
      // },
    ]
  });
};