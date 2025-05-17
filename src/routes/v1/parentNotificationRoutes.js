const express = require('express');
const router = express.Router();
const parentNotificationController = require('../../controllers/parentNotificationController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Routes for viewing notifications
router.get('/:id', parentNotificationController.getNotificationById);
router.get('/parent/:parentId', parentNotificationController.getParentNotifications);
router.get('/student/:studentId', parentNotificationController.getStudentNotifications);
router.get('/parent/:parentId/unread', parentNotificationController.getUnreadCount);

// Routes for managing notifications
router.post('/', restrictTo('teacher', 'admin'), parentNotificationController.createNotification);
router.patch('/:id', parentNotificationController.updateNotification);
router.patch('/:id/read', parentNotificationController.markAsRead);
router.patch('/parent/:parentId/read-all', parentNotificationController.markAllAsRead);
router.delete('/:id', parentNotificationController.deleteNotification);

module.exports = router;
