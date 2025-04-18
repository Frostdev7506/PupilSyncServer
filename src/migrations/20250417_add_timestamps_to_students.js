'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('students', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });

    await queryInterface.addColumn('students', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });

    await queryInterface.addColumn('students', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('students', 'created_at');
    await queryInterface.removeColumn('students', 'updated_at');
    await queryInterface.removeColumn('students', 'deleted_at');
  }
};