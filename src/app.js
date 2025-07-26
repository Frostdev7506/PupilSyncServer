const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUI = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerConfig = require('./config/swagger-config');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/error/errorHandler');
const { connectDB } = require('./config/db'); // Import the connectDB function
const socketManager = require('./utils/socketManager');

const app = express();

// Initialize database connection
connectDB(); // Actually connect to the database

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  hsts: { maxAge: 15552000, includeSubDomains: true },
}));
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

// Swagger Documentation
const specs = swaggerJSDoc(swaggerConfig);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));

// Routes
app.use('/api/v1', require('./routes/v1'));

// Error handling
app.use(errorHandler);

const port = config.port || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
socketManager.initialize(server);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
  logger.info(`Server running in ${config.env} mode on port ${port}`);


// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
