const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('DiscussionForums', {
    forumId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'forum_id'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      field: 'course_id',
      comment: "Course this forum belongs to (if applicable)"
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'lessons',
        key: 'lesson_id'
      },
      field: 'lesson_id',
      comment: "Lesson this forum belongs to (if applicable)"
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      field: 'class_id',
      comment: "Class this forum belongs to (if applicable)"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    forumType: {
      type: DataTypes.ENUM('general', 'announcement', 'question_answer', 'discussion', 'project'),
      allowNull: false,
      defaultValue: 'general',
      field: 'forum_type'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'created_by'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    isModerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_moderated',
      comment: "Whether posts require approval"
    },
    allowAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allow_anonymous',
      comment: "Whether anonymous posts are allowed"
    },
    allowAttachments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'allow_attachments'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'sort_order'
    },
    postCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'post_count'
    },
    lastPostAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_post_at'
    },
    lastPostBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'last_post_by'
    }
  }, {
    sequelize,
    tableName: 'discussion_forums',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "discussion_forums_pkey",
        unique: true,
        fields: [
          { name: "forum_id" },
        ]
      },
      {
        name: "idx_discussion_forums_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_discussion_forums_lesson_id",
        fields: [
          { name: "lesson_id" },
        ]
      },
      {
        name: "idx_discussion_forums_class_id",
        fields: [
          { name: "class_id" },
        ]
      },
      {
        name: "idx_discussion_forums_created_by",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "idx_discussion_forums_forum_type",
        fields: [
          { name: "forum_type" },
        ]
      }
    ]
  });
};
