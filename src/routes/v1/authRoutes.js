const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { authLimiter } = require('../../middlewares/auth/rateLimiter');

router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/register-institution', authLimiter, authController.registerInstitution);

router.post('/register-student', authLimiter, authController.registerStudent);
router.post('/register-teacher', authLimiter, authController.registerTeacher);
router.post('/register-parent', authLimiter, authController.registerParent);
router.get('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;