const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const { protect } = require('../../middlewares/auth');
const restrictTo = require('../../middlewares/auth/restrictTo');

// Routes for authenticated users
router.get('/me', protect, userController.getMe);
router.patch('/updateMe', protect, userController.updateMe);

// Admin only routes
router.get('/', restrictTo('admin'), userController.getAllUsers);

module.exports = router;
