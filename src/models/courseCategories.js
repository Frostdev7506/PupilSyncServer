const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CourseCategories', {
    categoryId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'category_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "course_categories_name_key"
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "course_categories_slug_key",
      comment: "URL-friendly version of name"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parentCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'course_categories',
        key: 'category_id'
      },
      field: 'parent_category_id',
      comment: "Parent category for hierarchical organization"
    },
    iconUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'icon_url'
    },
    imageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'image_url'
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Color code for UI display"
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order',
      comment: "Order for display in listings"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
    },
    metaTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'meta_title',
      comment: "SEO meta title"
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'meta_description',
      comment: "SEO meta description"
    },
    metaKeywords: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'meta_keywords',
      comment: "SEO meta keywords"
    },
    courseCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'course_count',
      comment: "Number of courses in this category"
    }
  }, {
    sequelize,
    tableName: 'course_categories',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "course_categories_pkey",
        unique: true,
        fields: [
          { name: "category_id" },
        ]
      },
      {
        name: "course_categories_name_key",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
      {
        name: "course_categories_slug_key",
        unique: true,
        fields: [
          { name: "slug" },
        ]
      },
      {
        name: "idx_course_categories_parent_category_id",
        fields: [
          { name: "parent_category_id" },
        ]
      },
      {
        name: "idx_course_categories_is_active",
        fields: [
          { name: "is_active" },
        ]
      },
      {
        name: "idx_course_categories_is_featured",
        fields: [
          { name: "is_featured" },
        ]
      },
      {
        name: "idx_course_categories_display_order",
        fields: [
          { name: "display_order" },
        ]
      }
    ]
  });
};
