const express = require('express');

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/error/errorHandler');
const { connectDB } = require('./config/db'); // Import the connectDB function

const app = express();

// Initialize database connection
connectDB(); // Actually connect to the database

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(rateLimit(config.rateLimit));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(require('morgan')('dev'));
}

// Routes
app.use('/api/v1', require('./routes/v1'));

// Error handling
app.use(errorHandler);

const port = config.port || 3000;
const server = app.listen(port, () => {
  logger.info(`Server running in ${config.env} mode on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
