const express = require('express');
const router = express.Router();
const parentNotificationController = require('../../controllers/parentNotificationController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Routes for viewing notifications
router.get('/:id', restrictTo('parent', 'teacher', 'admin'), parentNotificationController.getNotificationById);
router.get('/parent/:parentId', restrictTo('parent', 'teacher', 'admin'), parentNotificationController.getParentNotifications);
router.get('/student/:studentId', restrictTo('student', 'teacher', 'admin'), parentNotificationController.getStudentNotifications);
router.get('/parent/:parentId/unread', restrictTo('parent', 'teacher', 'admin'), parentNotificationController.getUnreadCount);

// Routes for managing notifications
router.post('/', restrictTo('teacher', 'admin'), parentNotificationController.createNotification);
router.patch('/:id', restrictTo('parent', 'teacher', 'admin'), parentNotificationController.updateNotification);
router.patch('/:id/read', restrictTo('parent', 'teacher', 'admin'), parentNotificationController.markAsRead);
router.patch('/parent/:parentId/read-all', restrictTo('parent', 'teacher', 'admin'), parentNotificationController.markAllAsRead);
router.delete('/:id', restrictTo('parent', 'teacher', 'admin'), parentNotificationController.deleteNotification);

module.exports = router;
