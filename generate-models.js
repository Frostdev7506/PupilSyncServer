const path = require('path');
const fs = require('fs').promises;
const SequelizeAuto = require('sequelize-auto');
const { sequelize } = require('./src/config/db');
const initModels = require('./src/models/init-models');

const MODELS_DIR = './src/models';

const options = {
  directory: MODELS_DIR,
  caseFile: 'c',
  caseModel: 'p',
  caseProp: 'c',
  additional: {
    timestamps: true,
    paranoid: true
  },
  lang: 'js'
};

async function generateModels() {
  console.log('📝 Generating models from database...');
  const auto = new SequelizeAuto(sequelize, null, null, options);

  try {
    await auto.run();
    console.log('✅ Models generated successfully!');
  } catch (error) {
    console.error('❌ Error generating models:', error);
    process.exit(1);
  }
}

async function syncDatabase(force = false) {
  console.log(`🔄 Syncing database${force ? ' (WITH FORCE)' : ''}...`);
  try {
    // Initialize models before syncing
    console.log('📋 Initializing models...');
    const models = initModels(sequelize);
    console.log(`📋 Loaded ${Object.keys(models).length} models`);

    // Sync the database with all initialized models
    await sequelize.sync({ force });
    console.log('✅ Database synced successfully!');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
      await generateModels();
      break;

    case 'sync':
      const force = args.includes('--force');
      if (force) {
        console.warn('⚠️  WARNING: Using force sync will drop all existing tables!');
        console.warn('⚠️  This should only be used in development.');
        console.warn('⚠️  Press Ctrl+C to cancel or wait 5 seconds to continue...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      await syncDatabase(force);
      break;

    case 'full':
      const forceSync = args.includes('--force');
      await generateModels();
      await syncDatabase(forceSync);
      break;

    default:
      console.log(`
Usage:
  node generate-models.js generate     - Generate models from database
  node generate-models.js sync         - Sync models to database (safe)
  node generate-models.js sync --force - Sync models to database (force)
  node generate-models.js full         - Generate and sync (safe)
  node generate-models.js full --force - Generate and sync (force)
      `);
  }

  await sequelize.close();
}

main().catch(console.error);