const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Courses', {
    courseId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'course_id'
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
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'institutions',
        key: 'institution_id'
      },
      field: 'institution_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    syllabus: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    learningObjectives: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'learning_objectives',
      comment: "Array of learning objectives for the course"
    },
    prerequisites: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Prerequisites for taking this course"
    },
    targetAudience: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'target_audience',
      comment: "Description of the intended audience"
    },
    level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'all_levels'),
      allowNull: true,
      defaultValue: 'all_levels'
    },
    format: {
      type: DataTypes.ENUM('online', 'blended', 'in_person', 'self_paced', 'live', 'project_based'),
      allowNull: true,
      defaultValue: 'online',
      comment: "Course delivery format"
    },
    estimatedHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'estimated_hours',
      comment: "Estimated hours to complete the course"
    },
    language: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'English'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: "Tags for categorizing and searching courses"
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Course price (null for free courses)"
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: 'USD'
    },
    coverImageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'cover_image_url'
    },
    promoVideoUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'promo_video_url'
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'is_published'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_featured'
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_private',
      comment: "If true, only invited students can enroll"
    },
    enrollmentLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'enrollment_limit',
      comment: "Maximum number of students (null for unlimited)"
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_date',
      comment: "For scheduled courses with specific start dates"
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date',
      comment: "For scheduled courses with specific end dates"
    },
    certificateEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'certificate_enabled',
      comment: "Whether completion certificates are enabled"
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: "Average course rating"
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'review_count'
    },
    enrollmentCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'enrollment_count'
    }
  }, {
    sequelize,
    tableName: 'courses',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    paranoid: true,
    associate: function(models) {
      this.belongsToMany(models.CourseCategories, {
        through: models.CourseCategoryMappings,
        foreignKey: 'courseId',
        as: 'categories'
      });
    },
    indexes: [
      {
        name: "courses_pkey",
        unique: true,
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_courses_institution_id",
        fields: [
          { name: "institution_id" },
        ]
      },
      {
        name: "idx_courses_teacher_id",
        fields: [
          { name: "teacher_id" },
        ]
      },
      {
        name: "idx_courses_is_published",
        fields: [
          { name: "is_published" },
        ]
      },
      {
        name: "idx_courses_is_featured",
        fields: [
          { name: "is_featured" },
        ]
      },
      {
        name: "idx_courses_format",
        fields: [
          { name: "format" },
        ]
      },
      {
        name: "idx_courses_level",
        fields: [
          { name: "level" },
        ]
      },
      {
        name: "idx_courses_category",
        fields: [
          { name: "category" },
        ]
      },
      {
        name: "idx_courses_price",
        fields: [
          { name: "price" },
        ]
      },
      {
        name: "idx_courses_rating",
        fields: [
          { name: "rating" },
        ]
      },
      {
        name: "idx_courses_tags",
        fields: [
          { name: "tags" },
        ]
      }
    ]
  });
};
