'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, ensure the new columns exist
    await queryInterface.addColumn('students', 'created_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('students', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Copy data from old columns to new ones
    await queryInterface.sequelize.query(`
      UPDATE students 
      SET created_at = "createdAt",
          updated_at = "updatedAt"
    `);

    // Make the new columns non-nullable
    await queryInterface.changeColumn('students', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });

    await queryInterface.changeColumn('students', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });

    // Remove old columns
    await queryInterface.removeColumn('students', 'createdAt');
    await queryInterface.removeColumn('students', 'updatedAt');
  },

  async down(queryInterface, Sequelize) {
    // Restore old columns
    await queryInterface.addColumn('students', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('students', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Copy data back
    await queryInterface.sequelize.query(`
      UPDATE students 
      SET "createdAt" = created_at,
          "updatedAt" = updated_at
    `);

    // Make old columns non-nullable
    await queryInterface.changeColumn('students', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });

    await queryInterface.changeColumn('students', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });

    // Remove new columns
    await queryInterface.removeColumn('students', 'created_at');
    await queryInterface.removeColumn('students', 'updated_at');
  }
};