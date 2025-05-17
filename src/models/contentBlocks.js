const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ContentBlocks', {
    contentBlockId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'content_block_id'
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lessons',
        key: 'lesson_id'
      },
      field: 'lesson_id'
    },
    blockType: {
      type: DataTypes.ENUM("text","image","video","quiz","assignment","file"),
      allowNull: false,
      field: 'block_type'
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'order_number'
    }
  }, {
    sequelize,
    tableName: 'content_blocks',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    associate: function(models) {
      this.hasMany(models.ContentEngagements, {
        foreignKey: 'contentBlockId',
        as: 'engagements'
      });
    },
    indexes: [
      {
        name: "content_blocks_pkey",
        unique: true,
        fields: [
          { name: "content_block_id" },
        ]
      },
      {
        name: "idx_content_blocks_content_gin",
        fields: [
          { name: "content" },
        ]
      },
      {
        name: "idx_content_blocks_lesson_id",
        fields: [
          { name: "lesson_id" },
        ]
      },
    ]
  });
};
