const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Parents', {
    parentId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'parent_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      unique: "parents_user_id_key",
      field: 'user_id'
    }
  }, {
    sequelize,
    tableName: 'parents',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "parents_pkey",
        unique: true,
        fields: [
          { name: "parent_id" },
        ]
      },
      {
        name: "parents_user_id_key",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
