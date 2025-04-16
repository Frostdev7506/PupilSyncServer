const { sequelize } = require('./src/config/db');
const initModels = require('./src/models/init-models');

async function syncUsersTable() {
  // Initialize all models (including Users)
  initModels(sequelize);

  try {
    // Sync only the Users table (creates if not exists)
    await sequelize.models.Users.sync({ alter: true });
    console.log('✅ Users table has been created or updated!');
  } catch (error) {
    console.error('❌ Error syncing Users table:', error);
  } finally {
    await sequelize.close();
  }
}

syncUsersTable();