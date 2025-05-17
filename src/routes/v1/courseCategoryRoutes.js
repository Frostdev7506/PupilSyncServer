const express = require('express');
const router = express.Router();
const courseCategoryController = require('../../controllers/courseCategoryController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Public routes
router.get('/', courseCategoryController.getAllCategories);
router.get('/hierarchy', courseCategoryController.getCategoryHierarchy);
router.get('/:id', courseCategoryController.getCategoryById);
router.get('/slug/:slug', courseCategoryController.getCategoryBySlug);
router.get('/:id/courses', courseCategoryController.getCategoryCourses);

// Admin-only routes
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', courseCategoryController.createCategory);
router.patch('/:id', courseCategoryController.updateCategory);
router.delete('/:id', courseCategoryController.deleteCategory);

module.exports = router;
