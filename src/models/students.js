const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Students', {
    studentId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'student_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      unique: "students_user_id_key",
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
    gradeLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'grade_level'
    }
  }, {
    sequelize,
    tableName: 'students',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: "students_pkey",
        unique: true,
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "students_user_id_key",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
