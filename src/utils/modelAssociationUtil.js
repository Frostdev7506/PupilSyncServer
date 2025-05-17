const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const AppError = require('./errors/AppError');

const models = initModels(sequelize);

/**
 * Utility functions for verifying model associations
 */
const modelAssociationUtil = {
  /**
   * Check if a model has a specific association
   * @param {string} modelName - The name of the model
   * @param {string} associationName - The name of the association
   * @returns {boolean} - True if the association exists
   */
  hasAssociation(modelName, associationName) {
    if (!models[modelName]) {
      throw new AppError(`Model ${modelName} does not exist`, 500);
    }
    
    const associations = models[modelName].associations || {};
    return !!associations[associationName];
  },
  
  /**
   * Get all associations for a model
   * @param {string} modelName - The name of the model
   * @returns {Object} - Object containing all associations
   */
  getAssociations(modelName) {
    if (!models[modelName]) {
      throw new AppError(`Model ${modelName} does not exist`, 500);
    }
    
    return models[modelName].associations || {};
  },
  
  /**
   * Verify that all required associations exist for a model
   * @param {string} modelName - The name of the model
   * @param {Array<string>} requiredAssociations - Array of required association names
   * @returns {Object} - Object with verification results
   */
  verifyRequiredAssociations(modelName, requiredAssociations) {
    if (!models[modelName]) {
      throw new AppError(`Model ${modelName} does not exist`, 500);
    }
    
    const associations = models[modelName].associations || {};
    const results = {
      valid: true,
      missing: [],
      existing: []
    };
    
    for (const association of requiredAssociations) {
      if (associations[association]) {
        results.existing.push(association);
      } else {
        results.missing.push(association);
        results.valid = false;
      }
    }
    
    return results;
  },
  
  /**
   * Get a list of all models
   * @returns {Array<string>} - Array of model names
   */
  getAllModels() {
    return Object.keys(models);
  }
};

module.exports = modelAssociationUtil;
