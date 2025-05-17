const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('DiscussionReplies', {
    replyId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'reply_id'
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'discussion_topics',
        key: 'topic_id'
      },
      field: 'topic_id'
    },
    parentReplyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'discussion_replies',
        key: 'reply_id'
      },
      field: 'parent_reply_id',
      comment: "For nested replies"
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
    isInstructorResponse: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_instructor_response',
      comment: "Whether this is an official instructor response"
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
    upvoteCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'upvote_count'
    },
    downvoteCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'downvote_count'
    },
    isAcceptedAnswer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_accepted_answer',
      comment: "Whether this reply is marked as the accepted answer"
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Array of attachment objects with URLs and metadata"
    }
  }, {
    sequelize,
    tableName: 'discussion_replies',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "discussion_replies_pkey",
        unique: true,
        fields: [
          { name: "reply_id" },
        ]
      },
      {
        name: "idx_discussion_replies_topic_id",
        fields: [
          { name: "topic_id" },
        ]
      },
      {
        name: "idx_discussion_replies_parent_reply_id",
        fields: [
          { name: "parent_reply_id" },
        ]
      },
      {
        name: "idx_discussion_replies_created_by",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "idx_discussion_replies_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_discussion_replies_is_accepted_answer",
        fields: [
          { name: "is_accepted_answer" },
        ]
      }
    ]
  });
};
