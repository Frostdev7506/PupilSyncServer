const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ProjectTeams', {
    teamId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'team_id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'collaborative_projects',
        key: 'project_id'
      },
      field: 'project_id'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'created_by'
    },
    teamLeaderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'students',
        key: 'student_id'
      },
      field: 'team_leader_id',
      comment: "Student designated as team leader"
    },
    status: {
      type: DataTypes.ENUM('forming', 'active', 'completed'),
      allowNull: false,
      defaultValue: 'forming'
    },
    submissionStatus: {
      type: DataTypes.ENUM('not_submitted', 'in_progress', 'submitted', 'graded'),
      allowNull: false,
      defaultValue: 'not_submitted',
      field: 'submission_status'
    },
    submissionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submission_date'
    },
    grade: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gradedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'graded_by'
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'graded_at'
    }
  }, {
    sequelize,
    tableName: 'project_teams',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "project_teams_pkey",
        unique: true,
        fields: [
          { name: "team_id" },
        ]
      },
      {
        name: "idx_project_teams_project_id",
        fields: [
          { name: "project_id" },
        ]
      },
      {
        name: "idx_project_teams_team_leader_id",
        fields: [
          { name: "team_leader_id" },
        ]
      },
      {
        name: "idx_project_teams_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_project_teams_submission_status",
        fields: [
          { name: "submission_status" },
        ]
      }
    ]
  });
};
