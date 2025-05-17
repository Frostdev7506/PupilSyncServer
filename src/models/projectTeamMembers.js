const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ProjectTeamMembers', {
    membershipId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'membership_id'
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project_teams',
        key: 'team_id'
      },
      field: 'team_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      field: 'student_id'
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Role within the team (e.g., 'Researcher', 'Developer')"
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'joined_at'
    },
    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'invited_by',
      comment: "User who invited this student to the team"
    },
    status: {
      type: DataTypes.ENUM('invited', 'active', 'left', 'removed'),
      allowNull: false,
      defaultValue: 'active'
    },
    contributionScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'contribution_score',
      comment: "Score representing member's contribution (0-100)"
    },
    peerFeedback: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'peer_feedback',
      comment: "Feedback from other team members"
    },
    individualGrade: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'individual_grade',
      comment: "Individual grade if different from team grade"
    }
  }, {
    sequelize,
    tableName: 'project_team_members',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "project_team_members_pkey",
        unique: true,
        fields: [
          { name: "membership_id" },
        ]
      },
      {
        name: "idx_project_team_members_team_id",
        fields: [
          { name: "team_id" },
        ]
      },
      {
        name: "idx_project_team_members_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_project_team_members_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_project_team_members_team_student",
        unique: true,
        fields: [
          { name: "team_id" },
          { name: "student_id" },
        ]
      }
    ]
  });
};
