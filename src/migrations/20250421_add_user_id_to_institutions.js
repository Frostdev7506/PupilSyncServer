module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('institutions', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('institutions', 'user_id');
  }
};