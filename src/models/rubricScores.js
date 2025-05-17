const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('RubricScores', {
    scoreId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'score_id'
    },
    submissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'submissions',
        key: 'submission_id'
      },
      field: 'submission_id'
    },
    criterionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rubric_criteria',
        key: 'criterion_id'
      },
      field: 'criterion_id'
    },
    score: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'rubric_scores',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "rubric_scores_pkey",
        unique: true,
        fields: [
          { name: "score_id" },
        ]
      },
      {
        name: "idx_rubric_scores_submission_id",
        fields: [
          { name: "submission_id" },
        ]
      },
      {
        name: "idx_rubric_scores_criterion_id",
        fields: [
          { name: "criterion_id" },
        ]
      },
      {
        name: "idx_rubric_scores_submission_criterion",
        unique: true,
        fields: [
          { name: "submission_id" },
          { name: "criterion_id" },
        ]
      }
    ]
  });
};
