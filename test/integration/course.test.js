// tests/integration/course.test.js
const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/db');
const initModels = require('../../src/models/init-models');
const models = initModels(sequelize);

// --- Mocking Authentication Middleware ---
// We mock the middleware to bypass the actual token verification
// and instead inject a mock user into the request object.
jest.mock('../../src/middlewares/auth', () => ({
  protect: (req, res, next) => {
    // Check for a specific header to determine which user to mock
    if (req.headers.authorization === 'Bearer teacher_token') {
      req.user = { 
        userId: 1, 
        role: 'teacher',
        teacher: { teacherId: 10 } // Mock teacher details
      };
    } else if (req.headers.authorization === 'Bearer admin_token') {
      req.user = { userId: 2, role: 'admin' };
    } else if (req.headers.authorization === 'Bearer other_teacher_token') {
      req.user = { 
        userId: 99, 
        role: 'teacher',
        teacher: { teacherId: 999 } // Different teacher
      };
    } else {
        // If no token or an invalid one, we can simulate being unauthenticated
        // by not attaching req.user, or we can explicitly deny
        req.user = null;
    }
    next();
  },
  restrictTo: (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ status: 'fail', message: 'Forbidden' });
  }
}));

// We still need to mock the separate restrictTo module for routes that import it directly
jest.mock('../../src/middlewares/auth/restrictTo', () => 
  (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ status: 'fail', message: 'Forbidden' });
  }
);


describe('Course Controller Integration Tests', () => {
  let courseId;
  let teacherId = 10;
  let categoryId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Seed necessary data
    await models.Users.create({ userId: 1, firstName: 'Test', lastName: 'Teacher', email: 'teacher@test.com', password_hash: 'hash', role: 'teacher' });
    await models.Teachers.create({ teacherId: 10, userId: 1 });
    
    // Create another teacher for permission tests
    await models.Users.create({ userId: 99, firstName: 'Other', lastName: 'Teacher', email: 'other@test.com', password_hash: 'hash', role: 'teacher' });
    await models.Teachers.create({ teacherId: 999, userId: 99 });
    
    // Create admin user
    await models.Users.create({ userId: 2, firstName: 'Admin', lastName: 'User', email: 'admin@test.com', password_hash: 'hash', role: 'admin' });
    
    // Create a test category
    const category = await models.CourseCategories.create({ name: 'Test Category', description: 'For testing' });
    categoryId = category.categoryId;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/courses', () => {
    it('should fail to create a course with invalid data (400)', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', 'Bearer teacher_token')
        .send({ description: 'Missing title' }); // Missing title
        
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("\"title\" is required");
    });

    it('should fail to create a course if not authenticated', async () => {
      const res = await request(app)
        .post('/api/courses')
        // No Authorization header
        .send({ title: 'Test Course', description: 'This is a test course.' });

      // Assuming authMiddleware + roleMiddleware catches this
      expect(res.statusCode).toBe(403);
    });

    it('should successfully create a new course for an authenticated teacher', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', 'Bearer teacher_token')
        .send({ 
          title: 'Test Course', 
          description: 'This is a test course.',
          categories: [categoryId],
          primaryCategoryId: categoryId,
          price: 99.99,
          format: 'online',
          formatSettings: { videoProvider: 'zoom' }
        });
        
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.course).toHaveProperty('courseId');
      expect(res.body.data.course.teacherId).toBe(teacherId);
      expect(res.body.data.course.price).toBe(99.99);
      expect(res.body.data.course.format).toBe('online');
      expect(res.body.data.course.formatSettings).toHaveProperty('videoProvider');
      courseId = res.body.data.course.courseId;
    });
  });

  describe('GET /api/courses', () => {
    it('should get a list of all courses', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.courses)).toBe(true);
      expect(res.body.data.courses.length).toBeGreaterThan(0);
    });

    it('should filter courses by teacher ID', async () => {
      const res = await request(app).get(`/api/courses?teacherId=${teacherId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.courses.every(course => course.teacherId === teacherId)).toBe(true);
    });

    it('should filter courses by category', async () => {
      const res = await request(app).get(`/api/courses?categoryId=${categoryId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.courses.length).toBeGreaterThan(0);
      // Verify each course has the category
      res.body.data.courses.forEach(course => {
        const hasCategory = course.categories.some(cat => cat.categoryId === categoryId);
        expect(hasCategory).toBe(true);
      });
    });

    it('should get a single course by its ID', async () => {
      const res = await request(app).get(`/api/courses/${courseId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.course.courseId).toBe(courseId);
    });

    it('should return 404 for a non-existent course ID', async () => {
      const res = await request(app).get('/api/courses/9999');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Course not found');
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('should fail to update if not the owner or an admin (403)', async () => {
        const res = await request(app)
            .put(`/api/courses/${courseId}`)
            .set('Authorization', 'Bearer other_teacher_token') // Different teacher
            .send({ title: 'Updated By Wrong User' });

        expect(res.statusCode).toBe(403);
    });
    
    it('should successfully update the course for the owner', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', 'Bearer teacher_token')
        .send({ title: 'Updated Title', description: 'Updated description.' });
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.course.title).toBe('Updated Title');
    });

    it('should successfully update course categories', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', 'Bearer teacher_token')
        .send({ 
          categories: [categoryId],
          primaryCategoryId: categoryId
        });
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.course.categories.length).toBeGreaterThan(0);
      expect(res.body.data.course.categories[0].categoryId).toBe(categoryId);
    });
  });

  describe('PATCH /api/courses/:id/syllabus', () => {
    it('should update course syllabus', async () => {
      const syllabus = { units: [{ title: 'Unit 1', lessons: [{ title: 'Lesson 1' }] }] };
      
      const res = await request(app)
        .patch(`/api/courses/${courseId}/syllabus`)
        .set('Authorization', 'Bearer teacher_token')
        .send({ syllabus });
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.course.syllabus).toEqual(syllabus);
    });

    it('should fail to update syllabus if not the owner', async () => {
      const res = await request(app)
        .patch(`/api/courses/${courseId}/syllabus`)
        .set('Authorization', 'Bearer other_teacher_token')
        .send({ syllabus: {} });
        
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/courses/:id/format', () => {
    it('should update course format', async () => {
      const format = 'hybrid';
      const formatSettings = { inPersonDays: ['Monday', 'Wednesday'] };
      
      const res = await request(app)
        .patch(`/api/courses/${courseId}/format`)
        .set('Authorization', 'Bearer teacher_token')
        .send({ format, formatSettings });
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.course.format).toBe(format);
      expect(res.body.data.course.formatSettings).toEqual(formatSettings);
    });

    it('should fail to update format if not the owner', async () => {
      const res = await request(app)
        .patch(`/api/courses/${courseId}/format`)
        .set('Authorization', 'Bearer other_teacher_token')
        .send({ format: 'online' });
        
      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    it('should fail to delete if not an admin or owner (403)', async () => {
        const res = await request(app)
            .delete(`/api/courses/${courseId}`)
            .set('Authorization', 'Bearer other_teacher_token'); // Different user
        
        expect(res.statusCode).toBe(403);
    });

    it('should successfully delete the course for an admin', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', 'Bearer admin_token');
        
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 when trying to get the deleted course', async () => {
      const res = await request(app).get(`/api/courses/${courseId}`);
      expect(res.statusCode).toBe(404);
    });
  });
});