const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CourseCategoryMappings', {
    mappingId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'mapping_id'
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
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'course_categories',
        key: 'category_id'
      },
      field: 'category_id'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary',
      comment: "Whether this is the primary category for the course"
    }
  }, {
    sequelize,
    tableName: 'course_category_mappings',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "course_category_mappings_pkey",
        unique: true,
        fields: [
          { name: "mapping_id" },
        ]
      },
      {
        name: "idx_course_category_mappings_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_course_category_mappings_category_id",
        fields: [
          { name: "category_id" },
        ]
      },
      {
        name: "idx_course_category_mappings_is_primary",
        fields: [
          { name: "is_primary" },
        ]
      },
      {
        name: "idx_course_category_mappings_unique",
        unique: true,
        fields: [
          { name: "course_id" },
          { name: "category_id" },
        ]
      }
    ]
  });
};
