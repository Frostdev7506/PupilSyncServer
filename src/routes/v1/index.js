const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const testRoutes = require('./testRoutes');
const institutionRoutes = require('./institutionRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/test', testRoutes);
router.use('/institutions', institutionRoutes);

module.exports = router;