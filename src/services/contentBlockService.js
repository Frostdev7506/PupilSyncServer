const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const modelAssociationUtil = require('../utils/modelAssociationUtil');

const models = initModels(sequelize);
const { 
  ContentBlocks, 
  Lessons,
  ContentEngagements
} = models;

// Verify required associations
const requiredAssociations = ['lesson', 'engagements'];
const associationVerification = modelAssociationUtil.verifyRequiredAssociations('ContentBlocks', requiredAssociations);

if (!associationVerification.valid) {
  console.error(`Missing required associations for ContentBlocks: ${associationVerification.missing.join(', ')}`);
}

const contentBlockService = {
  /**
   * Create a new content block
   * @param {Object} contentBlockData - The content block data
   * @returns {Promise<Object>} - The created content block
   */
  async createContentBlock(contentBlockData) {
    try {
      // Get the current highest order for content blocks in this lesson
      const maxOrderBlock = await ContentBlocks.findOne({
        where: { lessonId: contentBlockData.lessonId },
        order: [['order', 'DESC']]
      });
      
      const order = maxOrderBlock ? maxOrderBlock.order + 1 : 1;
      
      // Create the content block
      const contentBlock = await ContentBlocks.create({
        ...contentBlockData,
        order
      });
      
      // Return the content block with associations
      return this.getContentBlockById(contentBlock.contentBlockId);
    } catch (error) {
      throw new AppError(`Error creating content block: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a content block by ID
   * @param {number} contentBlockId - The content block ID
   * @returns {Promise<Object>} - The content block
   */
  async getContentBlockById(contentBlockId) {
    try {
      const contentBlock = await ContentBlocks.findByPk(contentBlockId, {
        include: [
          {
            model: Lessons,
            as: 'lesson'
          }
        ]
      });
      
      if (!contentBlock) {
        throw new AppError('Content block not found', 404);
      }
      
      return contentBlock;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving content block: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all content blocks for a lesson
   * @param {number} lessonId - The lesson ID
   * @returns {Promise<Array>} - The content blocks
   */
  async getContentBlocksByLesson(lessonId) {
    try {
      const contentBlocks = await ContentBlocks.findAll({
        where: { lessonId },
        order: [['order', 'ASC']]
      });
      
      return contentBlocks;
    } catch (error) {
      throw new AppError(`Error retrieving content blocks: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a content block
   * @param {number} contentBlockId - The content block ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated content block
   */
  async updateContentBlock(contentBlockId, updateData) {
    try {
      const contentBlock = await ContentBlocks.findByPk(contentBlockId);
      
      if (!contentBlock) {
        throw new AppError('Content block not found', 404);
      }
      
      // Update the content block
      await contentBlock.update(updateData);
      
      // Return the updated content block with associations
      return this.getContentBlockById(contentBlockId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating content block: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a content block
   * @param {number} contentBlockId - The content block ID
   * @returns {Promise<void>}
   */
  async deleteContentBlock(contentBlockId) {
    const transaction = await sequelize.transaction();
    
    try {
      const contentBlock = await ContentBlocks.findByPk(contentBlockId);
      
      if (!contentBlock) {
        await transaction.rollback();
        throw new AppError('Content block not found', 404);
      }
      
      const lessonId = contentBlock.lessonId;
      const order = contentBlock.order;
      
      // Delete the content block
      await contentBlock.destroy({ transaction });
      
      // Reorder remaining content blocks
      const remainingBlocks = await ContentBlocks.findAll({
        where: { 
          lessonId,
          order: { [Op.gt]: order }
        },
        order: [['order', 'ASC']],
        transaction
      });
      
      for (const block of remainingBlocks) {
        await block.update({ order: block.order - 1 }, { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting content block: ${error.message}`, 500);
    }
  },
  
  /**
   * Update content block order
   * @param {number} lessonId - The lesson ID
   * @param {Array<number>} contentBlockOrder - The new content block order (array of content block IDs)
   * @returns {Promise<void>}
   */
  async updateContentBlockOrder(lessonId, contentBlockOrder) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify all content blocks exist and belong to the lesson
      const contentBlocks = await ContentBlocks.findAll({
        where: { 
          lessonId,
          contentBlockId: { [Op.in]: contentBlockOrder }
        },
        transaction
      });
      
      if (contentBlocks.length !== contentBlockOrder.length) {
        await transaction.rollback();
        throw new AppError('One or more content blocks not found or do not belong to this lesson', 400);
      }
      
      // Update the order of each content block
      for (let i = 0; i < contentBlockOrder.length; i++) {
        await ContentBlocks.update(
          { order: i + 1 },
          { 
            where: { contentBlockId: contentBlockOrder[i] },
            transaction
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating content block order: ${error.message}`, 500);
    }
  },
  
  /**
   * Track content engagement
   * @param {Object} engagementData - The engagement data
   * @returns {Promise<Object>} - The created engagement record
   */
  async trackContentEngagement(engagementData) {
    try {
      // Check if the content block exists
      const contentBlock = await ContentBlocks.findByPk(engagementData.contentBlockId);
      
      if (!contentBlock) {
        throw new AppError('Content block not found', 404);
      }
      
      // Create or update the engagement record
      const [engagement, created] = await ContentEngagements.findOrCreate({
        where: {
          contentBlockId: engagementData.contentBlockId,
          userId: engagementData.userId
        },
        defaults: {
          engagementType: engagementData.engagementType,
          progress: engagementData.progress || 0,
          timeSpent: engagementData.timeSpent || 0
        }
      });
      
      if (!created) {
        // Update existing record
        await engagement.update({
          engagementType: engagementData.engagementType,
          progress: engagementData.progress !== undefined ? engagementData.progress : engagement.progress,
          timeSpent: engagementData.timeSpent !== undefined ? 
            (engagement.timeSpent + engagementData.timeSpent) : 
            engagement.timeSpent
        });
      }
      
      return engagement;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error tracking content engagement: ${error.message}`, 500);
    }
  },
  
  /**
   * Get content engagement statistics
   * @param {number} contentBlockId - The content block ID
   * @returns {Promise<Object>} - The engagement statistics
   */
  async getContentEngagementStats(contentBlockId) {
    try {
      // Check if the content block exists
      const contentBlock = await ContentBlocks.findByPk(contentBlockId);
      
      if (!contentBlock) {
        throw new AppError('Content block not found', 404);
      }
      
      // Get all engagement records for this content block
      const engagements = await ContentEngagements.findAll({
        where: { contentBlockId }
      });
      
      // Calculate statistics
      const totalEngagements = engagements.length;
      const averageProgress = totalEngagements > 0 ? 
        engagements.reduce((sum, record) => sum + record.progress, 0) / totalEngagements : 
        0;
      const averageTimeSpent = totalEngagements > 0 ? 
        engagements.reduce((sum, record) => sum + record.timeSpent, 0) / totalEngagements : 
        0;
      const completionRate = totalEngagements > 0 ? 
        engagements.filter(record => record.progress >= 100).length / totalEngagements * 100 : 
        0;
      
      // Count engagement types
      const engagementTypes = {};
      engagements.forEach(record => {
        engagementTypes[record.engagementType] = (engagementTypes[record.engagementType] || 0) + 1;
      });
      
      return {
        contentBlockId,
        totalEngagements,
        averageProgress,
        averageTimeSpent,
        completionRate,
        engagementTypes
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving content engagement statistics: ${error.message}`, 500);
    }
  }
};

module.exports = contentBlockService;
