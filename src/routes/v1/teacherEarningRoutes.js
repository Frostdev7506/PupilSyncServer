const express = require('express');
const router = express.Router();
const teacherEarningController = require('../../controllers/teacherEarningController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Routes for teachers to view their own earnings
router.get('/teacher/:teacherId', restrictTo('teacher', 'admin'), teacherEarningController.getTeacherEarnings);
router.get('/teacher/:teacherId/summary', restrictTo('teacher', 'admin'), teacherEarningController.getTeacherEarningsSummary);
router.get('/:id', restrictTo('teacher', 'admin'), teacherEarningController.getEarningById);

// Admin-only routes for managing earnings
router.post('/', restrictTo('admin'), teacherEarningController.createEarning);
router.patch('/:id', restrictTo('admin'), teacherEarningController.updateEarning);
router.delete('/:id', restrictTo('admin'), teacherEarningController.deleteEarning);

module.exports = router;
