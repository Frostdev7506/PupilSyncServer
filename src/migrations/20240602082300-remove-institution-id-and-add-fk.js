'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'institution_id');
    await queryInterface.addConstraint('institutions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_institutions_user_id',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('institutions', 'fk_institutions_user_id');
    await queryInterface.addColumn('users', 'institution_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'institutions',
        key: 'institution_id'
      }
    });
  }
};