'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PricingPlan extends Model {
    static associate(models) {
      // Define associations here
      PricingPlan.hasMany(models.PricingPlanFeature, {
        foreignKey: 'pricingPlanId',
        as: 'features'
      });
    }
  }
  
  PricingPlan.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    entityType: {
      type: DataTypes.ENUM('institution', 'student', 'teacher'),
      allowNull: false,
      validate: {
        isIn: [['institution', 'student', 'teacher']]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    priceMonthly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    priceAnnual: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    isRecommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    modelName: 'PricingPlan',
    tableName: 'PricingPlans',
    paranoid: true,
    defaultScope: {
      where: {
        isActive: true
      },
      include: [
        {
          association: 'features',
          attributes: ['id', 'feature', 'order'],
          order: [['order', 'ASC']]
        }
      ]
    },
    scopes: {
      withInactive: {
        where: {},
        include: [
          {
            association: 'features',
            attributes: ['id', 'feature', 'order'],
            order: [['order', 'ASC']]
          }
        ]
      }
    }
  });

  return PricingPlan;
};
