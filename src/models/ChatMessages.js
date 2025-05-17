const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ChatMessages', {
    messageId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'message_id'
    },
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_rooms',
        key: 'chat_id'
      },
      field: 'chat_id'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'sender_id'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    contentType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'text',
      field: 'content_type'
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'chat_messages',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "chat_messages_pkey",
        unique: true,
        fields: [
          { name: "message_id" },
        ]
      },
      {
        name: "idx_chat_messages_chat_id",
        fields: [
          { name: "chat_id" },
        ]
      },
      {
        name: "idx_chat_messages_sender_id",
        fields: [
          { name: "sender_id" },
        ]
      }
    ]
  });
};