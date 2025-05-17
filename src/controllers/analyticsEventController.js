const analyticsEventService = require('../services/analyticsEventService');
const AppError = require('../utils/errors/AppError');
const { validateAnalyticsEvent } = require('../utils/validators/analyticsEventValidator');
const paramParser = require('../utils/paramParser');

const analyticsEventController = {
  /**
   * Track a new analytics event
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async trackEvent(req, res, next) {
    try {
      // Validate request body
      const { error } = validateAnalyticsEvent(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Set the current user as the user if not specified
      const eventData = {
        ...req.body
      };

      if (!eventData.userId && req.user) {
        eventData.userId = req.user.userId;
      }

      const event = await analyticsEventService.trackEvent(eventData);

      res.status(201).json({
        status: 'success',
        data: {
          event
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get an event by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getEventById(req, res, next) {
    try {
      const { id } = req.params;

      const event = await analyticsEventService.getEventById(id);

      res.status(200).json({
        status: 'success',
        data: {
          event
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all events with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllEvents(req, res, next) {
    try {
      const { userId, eventType, entityType, entityId, startDate, endDate, limit, offset } = req.query;

      const filters = {
        userId: paramParser.parseInteger(userId),
        eventType,
        entityType,
        entityId: paramParser.parseInteger(entityId),
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate),
        ...paramParser.parsePagination(req.query)
      };

      const events = await analyticsEventService.getAllEvents(filters);

      res.status(200).json({
        status: 'success',
        results: events.length,
        data: {
          events
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get events for a specific user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUserEvents(req, res, next) {
    try {
      const { userId } = req.params;
      const { eventType, entityType, entityId, startDate, endDate, limit, offset } = req.query;

      const filters = {
        eventType,
        entityType,
        entityId: paramParser.parseInteger(entityId),
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate),
        ...paramParser.parsePagination(req.query)
      };

      const events = await analyticsEventService.getUserEvents(userId, filters);

      res.status(200).json({
        status: 'success',
        results: events.length,
        data: {
          events
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get events for a specific entity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getEntityEvents(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const { userId, eventType, startDate, endDate, limit, offset } = req.query;

      const filters = {
        userId: paramParser.parseInteger(userId),
        eventType,
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate),
        ...paramParser.parsePagination(req.query)
      };

      const events = await analyticsEventService.getEntityEvents(entityType, entityId, filters);

      res.status(200).json({
        status: 'success',
        results: events.length,
        data: {
          events
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an event
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;

      await analyticsEventService.deleteEvent(id);

      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get event counts by type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getEventCountsByType(req, res, next) {
    try {
      const { userId, entityType, entityId, startDate, endDate } = req.query;

      const filters = {
        userId: paramParser.parseInteger(userId),
        entityType,
        entityId: paramParser.parseInteger(entityId),
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate)
      };

      const counts = await analyticsEventService.getEventCountsByType(filters);

      res.status(200).json({
        status: 'success',
        data: {
          counts
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get event counts by entity type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getEventCountsByEntityType(req, res, next) {
    try {
      const { userId, eventType, startDate, endDate } = req.query;

      const filters = {
        userId: paramParser.parseInteger(userId),
        eventType,
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate)
      };

      const counts = await analyticsEventService.getEventCountsByEntityType(filters);

      res.status(200).json({
        status: 'success',
        data: {
          counts
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get event counts by day
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getEventCountsByDay(req, res, next) {
    try {
      const { userId, eventType, entityType, entityId, startDate, endDate } = req.query;

      const filters = {
        userId: paramParser.parseInteger(userId),
        eventType,
        entityType,
        entityId: paramParser.parseInteger(entityId),
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate)
      };

      const counts = await analyticsEventService.getEventCountsByDay(filters);

      res.status(200).json({
        status: 'success',
        data: {
          counts
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = analyticsEventController;
