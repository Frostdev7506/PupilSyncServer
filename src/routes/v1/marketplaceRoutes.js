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
router.patch('/services/:id', marketplaceController.updateService); // Authorization check in controller
router.delete('/services/:id', marketplaceController.deleteService); // Authorization check in controller

// Booking management
router.post('/services/:id/book', restrictTo('student'), marketplaceController.bookService);
router.get('/bookings/:id', marketplaceController.getBookingById); // Authorization check in controller
router.patch('/bookings/:id/status', marketplaceController.updateBookingStatus); // Authorization check in controller
router.get('/bookings', marketplaceController.getUserBookings);

// Teacher availability management
router.post('/availability', restrictTo('teacher'), marketplaceController.setTeacherAvailability);

module.exports = router;
