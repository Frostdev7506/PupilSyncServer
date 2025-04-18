const { sequelize } = require('../src/config/db');
const { seedTestData } = require('./seeders/testData');

let testData = {};

beforeAll(async () => {
  await sequelize.sync({ force: true });
  testData = await seedTestData();
});

afterAll(async () => {
  await sequelize.close();
});

module.exports = { testData };