const express = require('express');
const router = express.Router();
const protect = require('../../middlewares/auth').protect;
const restrictTo = require('../../middlewares/auth/restrictTo');

// Public route - no authentication required
router.get('/public', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'This is a public route'
  });
});

// Protected route - requires authentication
router.get('/protected', protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'You are authenticated!',
    user: {
      id: req.user.user_id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Admin only route - requires authentication and admin role
router.get('/admin', protect, restrictTo('admin'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'You are an admin!'
  });
});

module.exports = router;
