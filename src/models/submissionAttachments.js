const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SubmissionAttachments', {
    attachmentId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'attachment_id'
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
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name'
    },
    fileUrl: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: 'file_url'
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'file_type'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size'
    }
  }, {
    sequelize,
    tableName: 'submission_attachments',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "submission_attachments_pkey",
        unique: true,
        fields: [
          { name: "attachment_id" },
        ]
      },
      {
        name: "idx_submission_attachments_submission_id",
        fields: [
          { name: "submission_id" },
        ]
      }
    ]
  });
};
