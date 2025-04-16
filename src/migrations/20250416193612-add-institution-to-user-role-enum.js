'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'institution';
    `);
  },
  async down (queryInterface, Sequelize) {
    // No down migration for removing enum values (not supported in Postgres)
  }
};