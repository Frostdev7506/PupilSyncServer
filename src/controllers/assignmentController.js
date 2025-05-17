const assignmentService = require('../services/assignmentService');
const courseService = require('../services/courseService');
const AppError = require('../utils/errors/AppError');
const { validateAssignment, validateRubric } = require('../utils/validators/assignmentValidator');
const paramParser = require('../utils/paramParser');

const assignmentController = {
  /**
   * Create a new assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createAssignment(req, res, next) {
    try {
      // Validate request body
      const { error } = validateAssignment(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to create an assignment for this course
      const course = await courseService.getCourseById(req.body.courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to create assignments for this course', 403));
      }
      
      // If rubric is provided, validate it
      if (req.body.rubric) {
        const { error: rubricError } = validateRubric(req.body.rubric);
        if (rubricError) {
          return next(new AppError(rubricError.details[0].message, 400));
        }
      }
      
      const assignment = await assignmentService.createAssignment(req.body);
      
      res.status(201).json({
        status: 'success',
        data: {
          assignment
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get an assignment by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAssignmentById(req, res, next) {
    try {
      const { id } = req.params;
      
      const assignment = await assignmentService.getAssignmentById(id);
      
      // If assignment is not visible to students and user is a student, check if they're enrolled
      if (!assignment.visibleToStudents && req.user.role === 'student') {
        const course = await courseService.getCourseById(assignment.courseId);
        const isEnrolled = course.students.some(student => student.studentId === req.user.student.studentId);
        
        if (!isEnrolled) {
          return next(new AppError('You are not authorized to view this assignment', 403));
        }
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          assignment
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all assignments for a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAssignmentsByCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const { lessonId, visibleToStudents } = req.query;
      
      // Check if user is authorized to view assignments for this course
      const course = await courseService.getCourseById(courseId);
      
      // If user is a student, they can only see visible assignments
      if (req.user.role === 'student') {
        const isEnrolled = course.students.some(student => student.studentId === req.user.student.studentId);
        
        if (!isEnrolled) {
          return next(new AppError('You are not enrolled in this course', 403));
        }
        
        // Students can only see visible assignments
        const filters = {
          lessonId: paramParser.parseInteger(lessonId),
          visibleToStudents: true
        };
        
        const assignments = await assignmentService.getAssignmentsByCourse(courseId, filters);
        
        res.status(200).json({
          status: 'success',
          results: assignments.length,
          data: {
            assignments
          }
        });
      } else {
        // Teachers and admins can see all assignments
        const filters = {
          lessonId: paramParser.parseInteger(lessonId),
          visibleToStudents: paramParser.parseBoolean(visibleToStudents)
        };
        
        const assignments = await assignmentService.getAssignmentsByCourse(courseId, filters);
        
        res.status(200).json({
          status: 'success',
          results: assignments.length,
          data: {
            assignments
          }
        });
      }
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all assignments for the current student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentAssignments(req, res, next) {
    try {
      // Check if user is a student
      if (!req.user.student) {
        return next(new AppError('Only students can access their assignments', 403));
      }
      
      const { courseId, status, dueAfter, dueBefore } = req.query;
      
      const filters = {
        courseId: paramParser.parseInteger(courseId),
        status,
        dueAfter,
        dueBefore
      };
      
      const assignments = await assignmentService.getAssignmentsForStudent(req.user.student.studentId, filters);
      
      res.status(200).json({
        status: 'success',
        results: assignments.length,
        data: {
          assignments
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update an assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateAssignment(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateAssignment(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to update this assignment
      const assignment = await assignmentService.getAssignmentById(id);
      const course = await courseService.getCourseById(assignment.courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this assignment', 403));
      }
      
      // If rubric is provided, validate it
      if (req.body.rubric) {
        const { error: rubricError } = validateRubric(req.body.rubric);
        if (rubricError) {
          return next(new AppError(rubricError.details[0].message, 400));
        }
      }
      
      const updatedAssignment = await assignmentService.updateAssignment(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          assignment: updatedAssignment
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete an assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteAssignment(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if user is authorized to delete this assignment
      const assignment = await assignmentService.getAssignmentById(id);
      const course = await courseService.getCourseById(assignment.courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to delete this assignment', 403));
      }
      
      await assignmentService.deleteAssignment(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = assignmentController;
