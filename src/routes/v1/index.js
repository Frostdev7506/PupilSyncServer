const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const testRoutes = require('./testRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/test', testRoutes);

module.exports = router;