const express = require('express');
const router = express.Router();
const marketplaceController = require('../../controllers/marketplaceController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Public routes for browsing services
router.get('/services', marketplaceController.getAllServices);
router.get('/services/:id', marketplaceController.getServiceById);
router.get('/teachers/:teacherId/availability', marketplaceController.getTeacherAvailability);
router.get('/teachers/:teacherId/check-availability', marketplaceController.checkTeacherAvailability);

// Protected routes - require authentication
router.use(protect);

// Service management (teachers only)
router.post('/services', restrictTo('teacher'), marketplaceController.createTeacherService);
router.patch('/services/:id', restrictTo('teacher', 'admin'), marketplaceController.updateService);
router.delete('/services/:id', restrictTo('teacher', 'admin'), marketplaceController.deleteService);

// Booking management
router.post('/services/:id/book', restrictTo('student'), marketplaceController.bookService);
router.get('/bookings/:id', restrictTo('student', 'teacher', 'admin'), marketplaceController.getBookingById);
router.patch('/bookings/:id/status', restrictTo('student', 'teacher', 'admin'), marketplaceController.updateBookingStatus);
router.get('/bookings', marketplaceController.getUserBookings);

// Teacher availability management
router.post('/availability', restrictTo('teacher'), marketplaceController.setTeacherAvailability);

module.exports = router;
