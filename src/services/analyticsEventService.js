const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const modelAssociationUtil = require('../utils/modelAssociationUtil');

const models = initModels(sequelize);
const { AnalyticsEvents, Users } = models;

// Verify required associations
const requiredAssociations = ['user'];
const associationVerification = modelAssociationUtil.verifyRequiredAssociations('AnalyticsEvents', requiredAssociations);

if (!associationVerification.valid) {
  console.error(`Missing required associations for AnalyticsEvents: ${associationVerification.missing.join(', ')}`);
}

const analyticsEventService = {
  /**
   * Track a new analytics event
   * @param {Object} eventData - The event data
   * @returns {Promise<Object>} - The created event
   */
  async trackEvent(eventData) {
    try {
      // Add timestamp if not provided
      if (!eventData.timestamp) {
        eventData.timestamp = new Date();
      }

      const event = await AnalyticsEvents.create(eventData);
      return event;
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get an event by ID
   * @param {number} eventId - The event ID
   * @returns {Promise<Object>} - The event
   */
  async getEventById(eventId) {
    const event = await AnalyticsEvents.findByPk(eventId, {
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['userId', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    if (!event) {
      throw new AppError('Analytics event not found', 404);
    }

    return event;
  },

  /**
   * Get all events with optional filtering
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of events
   */
  async getAllEvents(filters = {}) {
    const {
      userId,
      eventType,
      entityType,
      entityId,
      startDate,
      endDate,
      limit,
      offset
    } = filters;

    const whereClause = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (eventType) {
      whereClause.eventType = eventType;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (entityId) {
      whereClause.entityId = entityId;
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    const events = await AnalyticsEvents.findAll({
      where: whereClause,
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['userId', 'firstName', 'lastName', 'email', 'role']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    return events;
  },

  /**
   * Get events for a specific user
   * @param {number} userId - The user ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of events
   */
  async getUserEvents(userId, filters = {}) {
    return this.getAllEvents({
      ...filters,
      userId
    });
  },

  /**
   * Get events for a specific entity
   * @param {string} entityType - The entity type
   * @param {number} entityId - The entity ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of events
   */
  async getEntityEvents(entityType, entityId, filters = {}) {
    return this.getAllEvents({
      ...filters,
      entityType,
      entityId
    });
  },

  /**
   * Delete an event
   * @param {number} eventId - The event ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteEvent(eventId) {
    const event = await AnalyticsEvents.findByPk(eventId);

    if (!event) {
      throw new AppError('Analytics event not found', 404);
    }

    await event.destroy();

    return true;
  },

  /**
   * Get event counts by type
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Event counts by type
   */
  async getEventCountsByType(filters = {}) {
    const { userId, entityType, entityId, startDate, endDate } = filters;

    const whereClause = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (entityId) {
      whereClause.entityId = entityId;
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    const counts = await AnalyticsEvents.findAll({
      where: whereClause,
      attributes: [
        'eventType',
        [sequelize.fn('COUNT', sequelize.col('event_id')), 'count']
      ],
      group: ['eventType'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    return counts.reduce((acc, item) => {
      acc[item.eventType] = parseInt(item.get('count'));
      return acc;
    }, {});
  },

  /**
   * Get event counts by entity type
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Event counts by entity type
   */
  async getEventCountsByEntityType(filters = {}) {
    const { userId, eventType, startDate, endDate } = filters;

    const whereClause = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (eventType) {
      whereClause.eventType = eventType;
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    const counts = await AnalyticsEvents.findAll({
      where: whereClause,
      attributes: [
        'entityType',
        [sequelize.fn('COUNT', sequelize.col('event_id')), 'count']
      ],
      group: ['entityType'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    return counts.reduce((acc, item) => {
      acc[item.entityType] = parseInt(item.get('count'));
      return acc;
    }, {});
  },

  /**
   * Get event counts by day
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Event counts by day
   */
  async getEventCountsByDay(filters = {}) {
    const { userId, eventType, entityType, entityId, startDate, endDate } = filters;

    const whereClause = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (eventType) {
      whereClause.eventType = eventType;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (entityId) {
      whereClause.entityId = entityId;
    }

    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    const counts = await AnalyticsEvents.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('event_id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']]
    });

    return counts.map(item => ({
      date: item.get('date'),
      count: parseInt(item.get('count'))
    }));
  }
};

module.exports = analyticsEventService;
