module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('students', 'createdAt');
    await queryInterface.removeColumn('students', 'updatedAt');
    await queryInterface.removeColumn('students', 'deletedAt');
    await queryInterface.addColumn('students', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn('students', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn('students', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('students', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn('students', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn('students', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.removeColumn('students', 'created_at');
    await queryInterface.removeColumn('students', 'updated_at');
    await queryInterface.removeColumn('students', 'deleted_at');
  }
};