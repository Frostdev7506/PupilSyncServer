const express = require('express');
const router = express.Router();
const attendanceController = require('../../controllers/attendanceController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All attendance routes require authentication
router.use(protect);

// Create attendance records
router.post('/', restrictTo('teacher', 'admin'), attendanceController.createAttendance);
router.post('/bulk', restrictTo('teacher', 'admin'), attendanceController.createBulkAttendance);

// Get attendance records
router.get('/:id', attendanceController.getAttendanceById);
router.get('/student/:studentId', attendanceController.getAttendanceByStudent);
router.get('/class/:classId', attendanceController.getAttendanceByClass);
router.get('/stats/student/:studentId', attendanceController.getStudentAttendanceStats);

// Update and delete attendance records
router.patch('/:id', restrictTo('teacher', 'admin'), attendanceController.updateAttendance);
router.delete('/:id', restrictTo('teacher', 'admin'), attendanceController.deleteAttendance);

module.exports = router;
