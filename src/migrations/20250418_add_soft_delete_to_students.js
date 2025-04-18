'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('students');

    if (!tableDescription.deletedAt) {
        await queryInterface.addColumn('students', 'deletedAt', {
            type: Sequelize.DATE,
            allowNull: true
        });
    }
},

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('students', 'deletedAt');
  }
};