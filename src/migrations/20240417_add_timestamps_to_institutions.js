'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('institutions', 'createdAt', {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn('institutions', 'updatedAt', {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn('institutions', 'deletedAt', {
      allowNull: true,
      type: Sequelize.DATE
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('institutions', 'createdAt');
    await queryInterface.removeColumn('institutions', 'updatedAt');
    await queryInterface.removeColumn('institutions', 'deletedAt');
  }
};