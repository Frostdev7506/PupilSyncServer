const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Teachers', {
    teacherId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'teacher_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      unique: "teachers_user_id_key",
      field: 'user_id'
    },
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'institutions',
        key: 'institution_id'
      },
      field: 'institution_id'
    },
    subjectExpertise: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'subject_expertise'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    profilePictureUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'profile_picture_url'
    }
  }, {
    sequelize,
    tableName: 'teachers',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "teachers_pkey",
        unique: true,
        fields: [
          { name: "teacher_id" },
        ]
      },
      {
        name: "teachers_user_id_key",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
