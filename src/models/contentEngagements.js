const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ContentEngagements', {
    engagementId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'engagement_id'
    },
    contentBlockId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'content_blocks',
        key: 'content_block_id'
      },
      field: 'content_block_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'user_id'
    },
    engagementType: {
      type: DataTypes.ENUM("view","like","bookmark","comment","completion"),
      allowNull: false,
      field: 'engagement_type'
    },
    engagementData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'engagement_data'
    }
  }, {
    sequelize,
    tableName: 'content_engagements',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "content_engagements_pkey",
        unique: true,
        fields: [
          { name: "engagement_id" },
        ]
      },
      {
        name: "idx_content_engagements_content_block_id",
        fields: [
          { name: "content_block_id" },
        ]
      },
      {
        name: "idx_content_engagements_user_id",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_content_engagements_type",
        fields: [
          { name: "engagement_type" },
        ]
      }
    ]
  });
};