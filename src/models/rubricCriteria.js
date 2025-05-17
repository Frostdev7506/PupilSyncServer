const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('RubricCriteria', {
    criterionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'criterion_id'
    },
    rubricId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assignment_rubrics',
        key: 'rubric_id'
      },
      field: 'rubric_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    maxPoints: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      field: 'max_points'
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'order_number'
    }
  }, {
    sequelize,
    tableName: 'rubric_criteria',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "rubric_criteria_pkey",
        unique: true,
        fields: [
          { name: "criterion_id" },
        ]
      },
      {
        name: "idx_rubric_criteria_rubric_id",
        fields: [
          { name: "rubric_id" },
        ]
      }
    ]
  });
};
