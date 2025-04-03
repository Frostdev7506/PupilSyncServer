const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Institutions', {
    institutionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'institution_id'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: "institutions_contact_email_key",
      field: 'contact_email'
    }
  }, {
    sequelize,
    tableName: 'institutions',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "institutions_contact_email_key",
        unique: true,
        fields: [
          { name: "contact_email" },
        ]
      },
      {
        name: "institutions_pkey",
        unique: true,
        fields: [
          { name: "institution_id" },
        ]
      },
    ]
  });
};
