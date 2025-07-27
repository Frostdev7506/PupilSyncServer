'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PricingPlanFeature extends Model {
    static associate(models) {
      // Define associations here
      PricingPlanFeature.belongsTo(models.PricingPlan, {
        foreignKey: 'pricingPlanId',
        as: 'pricingPlan'
      });
    }
  }
  
  PricingPlanFeature.init({
    pricingPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'PricingPlans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    feature: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: true
      }
    }
  }, {
    sequelize,
    modelName: 'PricingPlanFeature',
    tableName: 'PricingPlanFeatures',
    timestamps: true,
    paranoid: false
  });

  return PricingPlanFeature;
};
