'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FAQ extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  
  FAQ.init({
    entityType: {
      type: DataTypes.ENUM('institution', 'student', 'teacher'),
      allowNull: false,
      validate: {
        isIn: [['institution', 'student', 'teacher']]
      }
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 1000]
      }
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 5000]
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'FAQ',
    tableName: 'FAQs',
    paranoid: true,
    defaultScope: {
      where: {
        isActive: true
      },
      order: [['order', 'ASC']]
    },
    scopes: {
      withInactive: {
        where: {},
        order: [['order', 'ASC']]
      },
      byEntityType: (entityType) => ({
        where: { entityType },
        order: [['order', 'ASC']]
      })
    }
  });

  return FAQ;
};
