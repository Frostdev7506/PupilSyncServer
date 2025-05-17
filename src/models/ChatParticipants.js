const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ChatParticipants', {
    participantId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'participant_id'
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'user_id'
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_admin'
    }
  }, {
    sequelize,
    tableName: 'chat_participants',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "chat_participants_pkey",
        unique: true,
        fields: [
          { name: "participant_id" },
        ]
      },
      {
        name: "idx_chat_participants_chat_id",
        fields: [
          { name: "chat_id" },
        ]
      },
      {
        name: "idx_chat_participants_user_id",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_chat_participants_chat_user",
        unique: true,
        fields: [
          { name: "chat_id" },
          { name: "user_id" },
        ]
      }
    ]
  });
};