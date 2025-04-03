const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Admins', {
    adminId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'admin_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      unique: "admins_user_id_key",
      field: 'user_id'
    },
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions',
        key: 'institution_id'
      },
      field: 'institution_id'
    }
  }, {
    sequelize,
    tableName: 'admins',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "admins_pkey",
        unique: true,
        fields: [
          { name: "admin_id" },
        ]
      },
      {
        name: "admins_user_id_key",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
