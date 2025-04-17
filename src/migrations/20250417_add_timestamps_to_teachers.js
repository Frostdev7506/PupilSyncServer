'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teachers', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });

    await queryInterface.addColumn('teachers', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now')
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('teachers', 'createdAt');
    await queryInterface.removeColumn('teachers', 'updatedAt');
  }
};