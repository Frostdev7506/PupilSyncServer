const path = require('path');

module.exports = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PupilSync API',
      version: '1.0.0',
      description: 'API documentation for PupilSync education platform',
      contact: {
        name: 'API Support',
        email: 'neerajbutola8910@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    path.resolve(__dirname, '../controllers/**/*.js'),
    path.resolve(__dirname, '../routes/**/*.js')
  ]
};