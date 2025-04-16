const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/register-institution', authController.registerInstitution);
router.get('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;