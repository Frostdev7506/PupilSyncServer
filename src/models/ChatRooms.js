const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ChatRooms', {
    chatId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'chat_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'entity_id'
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_group'
    },
    isModerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_moderated'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'created_by'
    }
  }, {
    sequelize,
    tableName: 'chat_rooms',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "chat_rooms_pkey",
        unique: true,
        fields: [
          { name: "chat_id" },
        ]
      },
      {
        name: "idx_chat_rooms_created_by",
        fields: [
          { name: "created_by" },
        ]
      }
    ]
  });
};