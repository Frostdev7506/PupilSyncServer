const { Sequelize } = require("sequelize");
const config = require("./config.json");
const logger = require("../utils/logger");
const initModels = require("../models/init-models");
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  }
);

const db = initModels(sequelize);

// --- 3. ADD THE CONNECTION LOGIC AND SEQUELIZE INSTANCE TO THE 'db' OBJECT ---
db.sequelize = sequelize;
db.Sequelize = Sequelize;

const connectDB = async () => {
  const maxRetries = 5;
  const initialRetryDelay = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      logger.info("PostgreSQL connection established");
      return;
    } catch (err) {
      const retryDelay = initialRetryDelay * Math.pow(2, attempt - 1); // Exponential backoff
      logger.error(
        `PostgreSQL connection attempt ${attempt} failed: ${err.message}`
      );

      if (attempt === maxRetries) {
        logger.error(
          "Max connection retries reached. Server will continue running with limited functionality."
        );
        return;
      }

      logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
};

module.exports = { sequelize, connectDB, db };
