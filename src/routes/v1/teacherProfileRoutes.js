const express = require('express');
const router = express.Router();
const teacherProfileController = require('../../controllers/teacherProfileController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Public routes
router.get('/', teacherProfileController.getAllProfiles);
router.get('/:id', teacherProfileController.getProfileById);
router.get('/teacher/:teacherId', teacherProfileController.getProfileByTeacherId);

// Protected routes - only authenticated teachers can access
router.use(protect);
router.use(restrictTo('teacher'));

router.post('/', teacherProfileController.createProfile);
router.patch('/:id', teacherProfileController.updateProfile);
router.delete('/:id', teacherProfileController.deleteProfile);
router.patch('/:id/featured-courses', teacherProfileController.updateFeaturedCourses);

module.exports = router;
