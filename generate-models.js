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
    // await auto.run();
    console.log('✅ Models generated successfully!');
  } catch (error) {
    console.error('❌ Error generating models:', error);
    process.exit(1);
  }
}

async function syncDatabase(force = false) {
  console.log(`🔄 Syncing database${force ? ' (WITH FORCE)' : ''}...`);
  try {
    console.log('📋 Initializing models...');
    const models = initModels(sequelize);
    console.log(`📋 Loaded ${Object.keys(models).length} models`);

    const syncOrder = [
      models.SequelizeMeta,
      models.Users,
      models.Institutions,
      models.CourseCategories,
      models.Teachers,
      models.Students,
      models.Admins,
      models.Parents,
      models.ParentStudentLink,
      models.Courses,
      models.Lessons,
      models.ContentBlocks,
      models.Quizzes,
      models.QuizQuestions,
      models.QuizAnswers,
      models.Classes,
      models.Exams,
      models.ExamQuestions,
      models.ExamAnswers,
      models.ExamStudentAssignments,
      models.ExamQuestionAssignments,
      models.StudentExamAttempts,
      models.StudentExamResponses,
      models.Messages,
      models.ParentNotifications,
      // Reordered assignment and rubric models
      models.Assignments, // <-- Ensure Assignments is before Submissions
      models.Submissions, // <-- Moved Submissions before RubricScores
      models.AssignmentRubrics, // <-- Ensure AssignmentRubrics is before RubricCriteria
      models.RubricCriteria, // <-- Ensure RubricCriteria is before RubricScores
      models.RubricScores, // <-- Moved RubricScores after its dependencies
      models.StudentQuizAttempts,
      models.StudentQuizResponses,
      models.LearningAnalytics,
      models.CollaborativeProjects,
      models.ProjectTeams,
      // Ensure ALL your models are listed here in the correct order
      models.AnalyticsEvents,
      models.Attendance,
      models.ChatRooms,
      models.ChatParticipants,
      models.ChatMessages,
      models.ClassEnrollments,
      models.ContentEngagements,
      models.CourseCategoryMappings,
      models.CourseReviews,
      models.DiscussionForums,
      models.DiscussionTopics,
      models.DiscussionReplies,
      models.Enrollments,
      models.OtpCodes,
      models.ParentAccessSettings,
      models.ProjectTeamMembers,
      models.StudentProgressReports,
      models.SubmissionAttachments,
      models.TeacherEarnings,
      models.TeacherInstitutions,
      models.TeacherProfiles,
      models.TeacherReviews,
    ];

    const modelsInSyncOrder = syncOrder.map(model => model.name);
    const allModelNames = Object.keys(models);
    const missingModels = allModelNames.filter(name => !modelsInSyncOrder.includes(name));

    if (missingModels.length > 0) {
      console.warn(`⚠️ WARNING: The following models are not included in the syncOrder: ${missingModels.join(', ')}. They will NOT be synced.`);
    } else {
       console.log('📋 All models included in sync order.');
    }

    await sequelize.sync({ force, order: syncOrder });

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
      await syncDatabase(forceSync); // Sync first to create schema
      await generateModels(); // Then generate models from the created schema
      break;

    default:
      console.log(`
Usage:
  node generate-models.js generate     - Generate models from database
  node generate-models.js sync         - Sync models to database (safe/alter)
  node generate-models.js sync --force - Sync models to database (force/drop & create)
  node generate-models.js full         - Sync (safe/alter) and generate models
  node generate-models.js full --force - Sync (force/drop & create) and generate models
      `);
  }

  // await sequelize.close();
}

main().catch(console.error);