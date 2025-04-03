const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Protected routes - require authentication
router.use(protect);

// Routes for authenticated users
router.get('/me', userController.getMe);
router.patch('/updateMe', userController.updateMe);

// Admin only routes
router.get('/', restrictTo('admin'), userController.getAllUsers);

module.exports = router;
