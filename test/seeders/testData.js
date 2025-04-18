const { sequelize } = require('../../src/config/db');
const initModels = require('../../src/models/init-models');
const bcrypt = require('bcryptjs');

const models = initModels(sequelize);
const { Users, Institutions, Students } = models;

async function seedTestData() {
  try {
    // Create multiple test institution users and institutions
    const testInstitutions = [
      {
        user: {
          email: 'test.institution1@example.com',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'Institution1',
        },
        institution: {
          name: 'Test School 1',
          address: '123 Test St',
          contactEmail: 'test.institution1@example.com'
        }
      },
      {
        user: {
          email: 'test.institution2@example.com',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'Institution2',
        },
        institution: {
          name: 'Test School 2',
          address: '456 Test Ave',
          contactEmail: 'test.institution2@example.com'
        }
      }
    ];

    const createdInstitutions = [];

    for (const testData of testInstitutions) {
      const institutionUser = await Users.create({
        email: testData.user.email,
        passwordHash: await bcrypt.hash(testData.user.password, 12),
        firstName: testData.user.firstName,
        lastName: testData.user.lastName,
        role: 'institution',
        isVerified: true
      });

      const institution = await Institutions.create({
        userId: institutionUser.userId,
        name: testData.institution.name,
        address: testData.institution.address,
        contactEmail: testData.institution.contactEmail
      });

      createdInstitutions.push({ institutionUser, institution });

      // Log created institution IDs for verification
      console.log('Created Institutions:', createdInstitutions.map(inst => inst.institution.institutionId));

      // Additional seeding logic can be added here
    }

    console.log('Test data seeded successfully');
    return createdInstitutions;
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}

module.exports = { seedTestData };