const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('OtpCodes', {
    otpId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'otp_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "The user this OTP belongs to.",
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'user_id'
    },
    purpose: {
      type: DataTypes.ENUM("password_reset","two_factor_auth","email_verification"),
      allowNull: false,
      comment: "The reason this OTP was generated (e.g., 2FA, password reset)."
    },
    otpCodeHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "A secure hash (e.g., bcrypt) of the actual OTP code.",
      field: 'otp_code_hash'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Timestamp after which this OTP is no longer valid.",
      field: 'expires_at'
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "Flag indicating if the OTP has been successfully used.",
      field: 'is_used'
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when the OTP was successfully used (optional).",
      field: 'used_at'
    }
  }, {
    sequelize,
    tableName: 'otp_codes',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_otp_codes_expires_at",
        fields: [
          { name: "expires_at" },
        ]
      },
      {
        name: "idx_otp_codes_user_id",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_otp_codes_verification_lookup",
        fields: [
          { name: "user_id" },
          { name: "purpose" },
          { name: "is_used" },
          { name: "expires_at" },
        ]
      },
      {
        name: "otp_codes_pkey",
        unique: true,
        fields: [
          { name: "otp_id" },
        ]
      },
    ]
  });
};
