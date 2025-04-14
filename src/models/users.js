const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = function(sequelize, DataTypes) {
  const Users = sequelize.define('Users', {
    userId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "users_email_key"
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'last_name'
    },
    role: {
      type: DataTypes.ENUM("student", "teacher", "admin", "parent", "institution"),
      allowNull: false,
      comment: "User role determines access level and associated profile type"
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'is_verified'
    },
    verificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'verification_token'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "idx_users_email",
        fields: [{ name: "email" }]
      },
      {
        name: "users_email_key",
        unique: true,
        fields: [{ name: "email" }]
      },
      {
        name: "users_pkey",
        unique: true,
        fields: [{ name: "user_id" }]
      }
    ]
  });

  // Instance methods
  Users.prototype.correctPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  };

  Users.prototype.setPassword = async function(password) {
    this.password_hash = await bcrypt.hash(password, 12);
  };

  Users.prototype.changedPasswordAfter = function(JWTTimestamp) {
    if (this.updatedAt) {
      const changedTimestamp = parseInt(this.updatedAt.getTime() / 1000, 10);
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  };

  return Users;
};



