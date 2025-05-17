const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('LearningAnalytics', {
    analyticsId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'analytics_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      field: 'student_id'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      field: 'course_id',
      comment: "Course these analytics are for (if applicable)"
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'lessons',
        key: 'lesson_id'
      },
      field: 'lesson_id',
      comment: "Lesson these analytics are for (if applicable)"
    },
    contentBlockId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'content_blocks',
        key: 'content_block_id'
      },
      field: 'content_block_id',
      comment: "Content block these analytics are for (if applicable)"
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'time_spent',
      comment: "Time spent in seconds"
    },
    completionStatus: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      allowNull: true,
      field: 'completion_status'
    },
    completionPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'completion_percentage'
    },
    firstAccessedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'first_accessed_at'
    },
    lastAccessedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_accessed_at'
    },
    accessCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'access_count',
      comment: "Number of times accessed"
    },
    averageScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'average_score',
      comment: "Average score on assessments"
    },
    masteryLevel: {
      type: DataTypes.ENUM('not_assessed', 'novice', 'developing', 'proficient', 'advanced', 'mastery'),
      allowNull: true,
      defaultValue: 'not_assessed',
      field: 'mastery_level'
    },
    difficultyRating: {
      type: DataTypes.ENUM('very_easy', 'easy', 'moderate', 'difficult', 'very_difficult'),
      allowNull: true,
      field: 'difficulty_rating',
      comment: "Student's rating of difficulty"
    },
    engagementMetrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'engagement_metrics',
      comment: "Detailed engagement metrics"
    },
    learningPathProgress: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'learning_path_progress',
      comment: "Progress through recommended learning path"
    },
    strengths: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Identified strengths in subject areas"
    },
    weaknesses: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Identified areas for improvement"
    },
    recommendedResources: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'recommended_resources',
      comment: "Recommended learning resources"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'learning_analytics',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "learning_analytics_pkey",
        unique: true,
        fields: [
          { name: "analytics_id" },
        ]
      },
      {
        name: "idx_learning_analytics_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_learning_analytics_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_learning_analytics_lesson_id",
        fields: [
          { name: "lesson_id" },
        ]
      },
      {
        name: "idx_learning_analytics_content_block_id",
        fields: [
          { name: "content_block_id" },
        ]
      },
      {
        name: "idx_learning_analytics_mastery_level",
        fields: [
          { name: "mastery_level" },
        ]
      },
      {
        name: "idx_learning_analytics_student_course",
        unique: true,
        fields: [
          { name: "student_id" },
          { name: "course_id" },
        ]
      }
    ]
  });
};
