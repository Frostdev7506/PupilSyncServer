const express = require('express');
const router = express.Router();
const analyticsEventController = require('../../controllers/analyticsEventController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Route for tracking events (authenticated users only)
router.post('/', analyticsEventController.trackEvent);

// Routes for analytics (specific routes first)
router.get('/counts/by-type', restrictTo('admin', 'teacher'), analyticsEventController.getEventCountsByType);
router.get('/counts/by-entity-type', restrictTo('admin', 'teacher'), analyticsEventController.getEventCountsByEntityType);
router.get('/counts/by-day', restrictTo('admin', 'teacher'), analyticsEventController.getEventCountsByDay);

// Routes for viewing events
router.get('/', restrictTo('admin', 'teacher'), analyticsEventController.getAllEvents);
router.get('/user/:userId', restrictTo('admin', 'teacher'), analyticsEventController.getUserEvents);
router.get('/entity/:entityType/:entityId', restrictTo('admin', 'teacher'), analyticsEventController.getEntityEvents);
router.get('/:id', restrictTo('admin', 'teacher'), analyticsEventController.getEventById);

// Admin-only routes
router.delete('/:id', restrictTo('admin'), analyticsEventController.deleteEvent);

module.exports = router;
