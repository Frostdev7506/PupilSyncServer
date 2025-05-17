const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('DiscussionTopics', {
    topicId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'topic_id'
    },
    forumId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'discussion_forums',
        key: 'forum_id'
      },
      field: 'forum_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
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
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_anonymous'
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_pinned'
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_locked',
      comment: "Whether new replies are allowed"
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'approved'
    },
    moderatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'moderated_by'
    },
    moderatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'moderated_at'
    },
    moderationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'moderation_notes'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'view_count'
    },
    replyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'reply_count'
    },
    lastReplyAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_reply_at'
    },
    lastReplyBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'last_reply_by'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Array of attachment objects with URLs and metadata"
    }
  }, {
    sequelize,
    tableName: 'discussion_topics',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "discussion_topics_pkey",
        unique: true,
        fields: [
          { name: "topic_id" },
        ]
      },
      {
        name: "idx_discussion_topics_forum_id",
        fields: [
          { name: "forum_id" },
        ]
      },
      {
        name: "idx_discussion_topics_created_by",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "idx_discussion_topics_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_discussion_topics_is_pinned",
        fields: [
          { name: "is_pinned" },
        ]
      },
      {
        name: "idx_discussion_topics_last_reply_at",
        fields: [
          { name: "last_reply_at" },
        ]
      }
    ]
  });
};
