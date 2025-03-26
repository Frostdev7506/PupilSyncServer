const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/db');

describe('Auth API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  test('POST /api/v1/auth/signup - should create new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send(userData)
      .expect(201);

    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.password).toBeUndefined();
  });

  test('POST /api/v1/auth/login - should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(response.body.token).toBeDefined();
    expect(response.headers['set-cookie']).toBeDefined();
  });
});