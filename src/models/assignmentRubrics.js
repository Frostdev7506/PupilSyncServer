const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('AssignmentRubrics', {
    rubricId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'rubric_id'
    },
    assignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assignments',
        key: 'assignment_id'
      },
      unique: true,
      field: 'assignment_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    totalPoints: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      field: 'total_points'
    }
  }, {
    sequelize,
    tableName: 'assignment_rubrics',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "assignment_rubrics_pkey",
        unique: true,
        fields: [
          { name: "rubric_id" },
        ]
      },
      {
        name: "idx_assignment_rubrics_assignment_id",
        unique: true,
        fields: [
          { name: "assignment_id" },
        ]
      }
    ]
  });
};
