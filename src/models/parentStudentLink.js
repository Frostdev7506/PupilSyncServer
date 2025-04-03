const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ParentStudentLink', {
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'parents',
        key: 'parent_id'
      },
      field: 'parent_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'students',
        key: 'student_id'
      },
      field: 'student_id'
    },
    relationship: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'parent_student_link',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "parent_student_link_pkey",
        unique: true,
        fields: [
          { name: "parent_id" },
          { name: "student_id" },
        ]
      },
    ]
  });
};
