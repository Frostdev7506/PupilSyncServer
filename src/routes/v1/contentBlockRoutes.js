const express = require('express');
const router = express.Router();
const contentBlockController = require('../../controllers/contentBlockController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Get content block by ID
router.get('/:id', contentBlockController.getContentBlockById);

// Get content blocks by lesson
router.get('/lesson/:lessonId', contentBlockController.getContentBlocksByLesson);

// Create, update, and delete content blocks (teachers and admins only)
router.post('/', restrictTo('teacher', 'admin'), contentBlockController.createContentBlock);
router.patch('/:id', restrictTo('teacher', 'admin'), contentBlockController.updateContentBlock);
router.delete('/:id', restrictTo('teacher', 'admin'), contentBlockController.deleteContentBlock);

// Content block order management
router.patch('/lesson/:lessonId/order', restrictTo('teacher', 'admin'), contentBlockController.updateContentBlockOrder);

// Content engagement tracking
router.post('/:id/engagement', contentBlockController.trackContentEngagement);
router.get('/:id/engagement/stats', restrictTo('teacher', 'admin'), contentBlockController.getContentEngagementStats);

module.exports = router;
