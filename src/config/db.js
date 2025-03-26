const { Sequelize } = require('sequelize');
const config = require('./config.json');
const logger = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  dialectOptions: dbConfig.dialectOptions,
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    logger.info('PostgreSQL connection established');
  } catch (err) {
    logger.error(`PostgreSQL connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
