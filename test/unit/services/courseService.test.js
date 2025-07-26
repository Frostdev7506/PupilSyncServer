// tests/unit/courseService.test.js

// Mock the init-models file to return our mock models
const mockModels = {
  Courses: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  CourseCategoryMappings: {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
  },
};

jest.mock('../../../src/models/init-models', () => {
  return jest.fn(() => mockModels);
});

const courseService = require('../../../src/services/courseService');
const { Op } = require('sequelize');
const AppError = require('../../../src/utils/errors/AppError');


describe('Course Service', () => {
  // Reset mocks before each test to ensure isolation
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Test createCourse ---
  describe('createCourse', () => {
    it('should create a course and return it with associations', async () => {
      const courseData = { title: 'New Course', description: 'Desc' };
      const createdCourse = { courseId: 1, ...courseData, toJSON: () => ({ courseId: 1, ...courseData }) };
      
      // Mock the return values of our database calls
      mockModels.Courses.create.mockResolvedValue(createdCourse);
      
      // Since createCourse calls getCourseById at the end, we need to mock that too.
      // Let's spy on it and provide a mock implementation.
      const getCourseByIdSpy = jest.spyOn(courseService, 'getCourseById').mockResolvedValue(createdCourse);
      
      const result = await courseService.createCourse(courseData);

      expect(mockModels.sequelize.transaction).toHaveBeenCalledTimes(1);
      expect(mockModels.Courses.create).toHaveBeenCalledWith(courseData, expect.any(Object));
      expect(result).toEqual(createdCourse);
      
      getCourseByIdSpy.mockRestore(); // Clean up the spy
    });

    it('should create a course with categories if provided', async () => {
      const courseData = { 
        title: 'New Course', 
        description: 'Desc',
        categories: [1, 2, 3],
        primaryCategoryId: 1
      };
      const createdCourse = { courseId: 1, ...courseData, toJSON: () => ({ courseId: 1, ...courseData }) };
      
      mockModels.Courses.create.mockResolvedValue(createdCourse);
      const getCourseByIdSpy = jest.spyOn(courseService, 'getCourseById').mockResolvedValue(createdCourse);
      
      await courseService.createCourse(courseData);

      expect(mockModels.CourseCategoryMappings.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ categoryId: 1, isPrimary: true }),
          expect.objectContaining({ categoryId: 2, isPrimary: false }),
          expect.objectContaining({ categoryId: 3, isPrimary: false })
        ]),
        expect.any(Object)
      );
      
      getCourseByIdSpy.mockRestore();
    });

    it('should throw an AppError if course creation fails', async () => {
      const error = new Error('Database error');
      mockModels.Courses.create.mockRejectedValue(error);

      await expect(courseService.createCourse({})).rejects.toThrow(
        new AppError(`Error creating course: ${error.message}`, 500)
      );
    });
  });

  // --- Test getCourseById ---
  describe('getCourseById', () => {
    it('should return a course if found', async () => {
      const mockCourse = { courseId: 1, title: 'Found Course' };
      mockModels.Courses.findByPk.mockResolvedValue(mockCourse);

      const result = await courseService.getCourseById(1);
      
      expect(mockModels.Courses.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toEqual(mockCourse);
    });

    it('should throw a 404 AppError if course is not found', async () => {
      mockModels.Courses.findByPk.mockResolvedValue(null);

      await expect(courseService.getCourseById(999)).rejects.toThrow(
        new AppError('Course not found', 404)
      );
    });

    it('should throw a 500 AppError if database query fails', async () => {
      const error = new Error('Database error');
      mockModels.Courses.findByPk.mockRejectedValue(error);

      await expect(courseService.getCourseById(1)).rejects.toThrow(
        new AppError(`Error retrieving course: ${error.message}`, 500)
      );
    });
  });

  // --- Test getAllCourses ---
  describe('getAllCourses', () => {
    it('should retrieve all courses with default filters', async () => {
        mockModels.Courses.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        
        await courseService.getAllCourses();

        expect(mockModels.Courses.findAll).toHaveBeenCalledWith(expect.objectContaining({
            limit: 10,
            offset: 0,
            order: [['createdAt', 'DESC']],
        }));
    });

    it('should build a where clause based on provided filters', async () => {
        const filters = {
            teacherId: 5,
            searchQuery: 'testing',
            minPrice: 10
        };
        mockModels.Courses.findAll.mockResolvedValue([]);
        
        await courseService.getAllCourses(filters);

        expect(mockModels.Courses.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                teacherId: 5,
                price: { [Op.gte]: 10 },
                [Op.or]: [
                    { title: { [Op.iLike]: '%testing%' } },
                    { description: { [Op.iLike]: '%testing%' } }
                ]
            }
        }));
    });

    it('should include category filter if categoryId is provided', async () => {
        const filters = { categoryId: 3 };
        mockModels.Courses.findAll.mockResolvedValue([]);
        
        await courseService.getAllCourses(filters);

        expect(mockModels.Courses.findAll).toHaveBeenCalledWith(
            expect.objectContaining({
                include: expect.arrayContaining([
                    expect.objectContaining({
                        model: expect.anything(),
                        as: 'categories',
                        through: { where: { categoryId: 3 } }
                    })
                ])
            })
        );
    });

    it('should throw an AppError if course retrieval fails', async () => {
        const error = new Error('Database error');
        mockModels.Courses.findAll.mockRejectedValue(error);

        await expect(courseService.getAllCourses()).rejects.toThrow(
            new AppError(`Error retrieving courses: ${error.message}`, 500)
        );
    });
  });

  // --- Test updateCourse ---
  describe('updateCourse', () => {
    it('should update a course and return the new data', async () => {
        const mockCourse = {
            courseId: 1,
            update: jest.fn().mockResolvedValue(true)
        };
        const updateData = { title: 'Updated Title' };
        
        mockModels.Courses.findByPk.mockResolvedValue(mockCourse);
        
        const getCourseByIdSpy = jest.spyOn(courseService, 'getCourseById').mockResolvedValue({ courseId: 1, ...updateData });

        const result = await courseService.updateCourse(1, updateData);

        expect(mockModels.Courses.findByPk).toHaveBeenCalledWith(1);
        expect(mockCourse.update).toHaveBeenCalledWith(updateData, expect.any(Object));
        expect(result.title).toBe('Updated Title');

        getCourseByIdSpy.mockRestore();
    });

    it('should update course categories if provided', async () => {
        const mockCourse = {
            courseId: 1,
            update: jest.fn().mockResolvedValue(true)
        };
        const updateData = { 
            title: 'Updated Title',
            categories: [1, 2],
            primaryCategoryId: 2
        };
        
        mockModels.Courses.findByPk.mockResolvedValue(mockCourse);
        const getCourseByIdSpy = jest.spyOn(courseService, 'getCourseById').mockResolvedValue({ courseId: 1, ...updateData });

        await courseService.updateCourse(1, updateData);

        expect(mockModels.CourseCategoryMappings.destroy).toHaveBeenCalledWith(
            expect.objectContaining({ where: { courseId: 1 } })
        );
        expect(mockModels.CourseCategoryMappings.bulkCreate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ categoryId: 1, isPrimary: false }),
                expect.objectContaining({ categoryId: 2, isPrimary: true })
            ]),
            expect.any(Object)
        );

        getCourseByIdSpy.mockRestore();
    });

    it('should throw a 404 AppError if course to update is not found', async () => {
        mockModels.Courses.findByPk.mockResolvedValue(null);

        await expect(courseService.updateCourse(999, {})).rejects.toThrow(
            new AppError('Course not found', 404)
        );
    });

    it('should throw an AppError if update fails', async () => {
        const mockCourse = {
            courseId: 1,
            update: jest.fn().mockRejectedValue(new Error('Update failed'))
        };
        mockModels.Courses.findByPk.mockResolvedValue(mockCourse);

        await expect(courseService.updateCourse(1, {})).rejects.toThrow(
            new AppError('Error updating course: Update failed', 500)
        );
    });
  });

  // --- Test deleteCourse ---
  describe('deleteCourse', () => {
      it('should delete a course successfully', async () => {
          const mockCourse = {
              courseId: 1,
              destroy: jest.fn().mockResolvedValue(true)
          };
          mockModels.Courses.findByPk.mockResolvedValue(mockCourse);

          await courseService.deleteCourse(1);

          expect(mockModels.Courses.findByPk).toHaveBeenCalledWith(1);
          expect(mockCourse.destroy).toHaveBeenCalledTimes(1);
      });

      it('should throw a 404 AppError if course to delete is not found', async () => {
          mockModels.Courses.findByPk.mockResolvedValue(null);

          await expect(courseService.deleteCourse(999)).rejects.toThrow(
              new AppError('Course not found', 404)
          );
      });

      it('should throw an AppError if deletion fails', async () => {
          const mockCourse = {
              courseId: 1,
              destroy: jest.fn().mockRejectedValue(new Error('Deletion failed'))
          };
          mockModels.Courses.findByPk.mockResolvedValue(mockCourse);

          await expect(courseService.deleteCourse(1)).rejects.toThrow(
              new AppError('Error deleting course: Deletion failed', 500)
          );
      });
  });

  // --- Test updateCourseSyllabus ---
  describe('updateCourseSyllabus', () => {
      it('should update course syllabus successfully', async () => {
          const syllabus = { units: [{ title: 'Unit 1' }] };
          const mockCourse = {
              courseId: 1,
              update: jest.fn().mockResolvedValue(true)
          };
          mockModels.Courses.findByPk.mockResolvedValue(mockCourse);
          const getCourseByIdSpy = jest.spyOn(courseService, 'getCourseById').mockResolvedValue({ courseId: 1, syllabus });

          const result = await courseService.updateCourseSyllabus(1, syllabus);

          expect(mockCourse.update).toHaveBeenCalledWith({ syllabus });
          expect(result.syllabus).toEqual(syllabus);

          getCourseByIdSpy.mockRestore();
      });

      it('should throw a 404 AppError if course is not found', async () => {
          mockModels.Courses.findByPk.mockResolvedValue(null);

          await expect(courseService.updateCourseSyllabus(999, {})).rejects.toThrow(
              new AppError('Course not found', 404)
          );
      });

      it('should throw an AppError if syllabus update fails', async () => {
          const mockCourse = {
              courseId: 1,
              update: jest.fn().mockRejectedValue(new Error('Update failed'))
          };
          mockModels.Courses.findByPk.mockResolvedValue(mockCourse);

          await expect(courseService.updateCourseSyllabus(1, {})).rejects.toThrow(
              new AppError('Error updating course syllabus: Update failed', 500)
          );
      });
  });

  // --- Test updateCourseFormat ---
  describe('updateCourseFormat', () => {
      it('should update course format successfully', async () => {
          const format = 'online';
          const formatSettings = { videoProvider: 'zoom' };
          const mockCourse = {
              courseId: 1,
              update: jest.fn().mockResolvedValue(true)
          };
          mockModels.Courses.findByPk.mockResolvedValue(mockCourse);
          const getCourseByIdSpy = jest.spyOn(courseService, 'getCourseById').mockResolvedValue({ 
              courseId: 1, format, formatSettings 
          });

          const result = await courseService.updateCourseFormat(1, format, formatSettings);

          expect(mockCourse.update).toHaveBeenCalledWith({ format, formatSettings });
          expect(result.format).toBe(format);
          expect(result.formatSettings).toEqual(formatSettings);

          getCourseByIdSpy.mockRestore();
      });

      it('should throw a 404 AppError if course is not found', async () => {
          mockModels.Courses.findByPk.mockResolvedValue(null);

          await expect(courseService.updateCourseFormat(999, 'online', {})).rejects.toThrow(
              new AppError('Course not found', 404)
          );
      });

      it('should throw an AppError if format update fails', async () => {
          const mockCourse = {
              courseId: 1,
              update: jest.fn().mockRejectedValue(new Error('Update failed'))
          };
          mockModels.Courses.findByPk.mockResolvedValue(mockCourse);

          await expect(courseService.updateCourseFormat(1, 'online', {})).rejects.toThrow(
              new AppError('Error updating course format: Update failed', 500)
          );
      });
  });
});