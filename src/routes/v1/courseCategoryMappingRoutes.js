const express = require('express');
const router = express.Router();
const courseCategoryMappingController = require('../../controllers/courseCategoryMappingController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Public routes
router.get('/course/:courseId', courseCategoryMappingController.getCourseMappings);
router.get('/:id', courseCategoryMappingController.getMappingById);

// Protected routes for teachers and admins
router.use(protect);
router.use(restrictTo('teacher', 'admin'));

router.post('/', courseCategoryMappingController.createMapping);
router.patch('/:id', courseCategoryMappingController.updateMapping);
router.delete('/:id', courseCategoryMappingController.deleteMapping);
router.post('/course/:courseId/categories', courseCategoryMappingController.setCourseCategories);

module.exports = router;
