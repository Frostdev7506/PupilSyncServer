const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TeacherInstitutions', {
    teacherInstitutionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'teacher_institution_id'
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'teacher_id'
      },
      field: 'teacher_id'
    },
    institutionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions',
        key: 'institution_id'
      },
      field: 'institution_id'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary'
    }
  }, {
    sequelize,
    tableName: 'teacher_institutions',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "teacher_institutions_pkey",
        unique: true,
        fields: [
          { name: "teacher_institution_id" },
        ]
      },
      {
        name: "teacher_institutions_teacher_institution",
        unique: true,
        fields: [
          { name: "teacher_id" },
          { name: "institution_id" },
        ]
      }
    ]
  });
};