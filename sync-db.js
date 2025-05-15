/**
 * This script synchronizes the database schema with the Sequelize models
 * It handles the creation of tables in the correct order to respect foreign key constraints
 */

const { sequelize } = require('./src/config/db');
const initModels = require('./src/models/init-models');

// Define the order in which tables should be created
// This is important to handle foreign key constraints
const tableCreationOrder = [
  'Users',           // Base table with no foreign keys
  'Institutions',    // Depends on Users
  'Teachers',        // Depends on Users
  'Students',        // Depends on Users and Institutions
  'Parents',         // Depends on Users
  'Admins',          // Depends on Users and Institutions
  'TeacherInstitutions', // Junction table for Teachers and Institutions
  'Courses',         // Depends on Teachers and Institutions
  'Classes',         // Depends on Institutions
  'ClassEnrollments', // Depends on Classes and Students
  'Lessons',         // Depends on Courses
  'ContentBlocks',   // Depends on Lessons
  'Quizzes',         // Depends on Courses and Lessons
  'QuizQuestions',   // Depends on Quizzes
  'QuizAnswers',     // Depends on QuizQuestions
  'Assignments',     // Depends on Courses and Lessons
  'Enrollments',     // Depends on Courses and Students
  'StudentQuizAttempts', // Depends on Students and Quizzes
  'StudentQuizResponses', // Depends on StudentQuizAttempts, QuizQuestions, and QuizAnswers
  'Submissions',     // Depends on Assignments and Students
  'ParentStudentLink', // Junction table for Parents and Students
  'Messages',        // Depends on Users (sender and receiver)
  'OtpCodes'         // Depends on Users
];

async function syncDatabase(force = false) {
  console.log(`🔄 Syncing database${force ? ' (WITH FORCE)' : ''}...`);
  
  try {
    // Initialize all models
    console.log('📋 Initializing models...');
    const models = initModels(sequelize);
    console.log(`📋 Loaded ${Object.keys(models).length} models`);
    
    // If force is true, drop all tables first
    if (force) {
      console.log('🗑️ Dropping all tables...');
      await sequelize.drop();
      console.log('✅ All tables dropped successfully');
    }
    
    // Create tables in the specified order
    console.log('🏗️ Creating tables in order...');
    
    for (const modelName of tableCreationOrder) {
      if (!models[modelName]) {
        console.warn(`⚠️ Model ${modelName} not found, skipping`);
        continue;
      }
      
      console.log(`📦 Creating table for model: ${modelName}`);
      await models[modelName].sync({ force: false });
      console.log(`✅ Table for ${modelName} created successfully`);
    }
    
    console.log('✅ Database schema synchronized successfully!');
    
    // Add associations after all tables are created
    console.log('🔄 Setting up associations...');
    
    // The associations are already defined in the init-models.js file
    // We just need to make sure all tables exist before they're applied
    
    console.log('✅ All done! Database is now in sync with your models.');
    
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
const args = process.argv.slice(2);
const force = args.includes('--force');

if (force) {
  console.warn('⚠️ WARNING: Using force sync will drop all existing tables!');
  console.warn('⚠️ This should only be used in development.');
  console.warn('⚠️ Press Ctrl+C to cancel or wait 5 seconds to continue...');
  setTimeout(() => {
    syncDatabase(force)
      .then(() => sequelize.close())
      .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
      });
  }, 5000);
} else {
  syncDatabase(force)
    .then(() => sequelize.close())
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
