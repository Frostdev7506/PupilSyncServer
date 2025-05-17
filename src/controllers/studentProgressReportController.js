const studentProgressReportService = require('../services/studentProgressReportService');
const parentAccessSettingsService = require('../services/parentAccessSettingsService');
const AppError = require('../utils/errors/AppError');
const { validateStudentProgressReport } = require('../utils/validators/studentProgressReportValidator');

const studentProgressReportController = {
  /**
   * Create a new student progress report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createReport(req, res, next) {
    try {
      // Validate request body
      const { error } = validateStudentProgressReport(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Only teachers and admins can create reports
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return next(new AppError('Only teachers and administrators can create progress reports', 403));
      }
      
      // Set the current teacher as the creator if not specified
      const reportData = {
        ...req.body
      };
      
      if (req.user.teacher && !reportData.teacherId) {
        reportData.teacherId = req.user.teacher.teacherId;
      }
      
      const report = await studentProgressReportService.createReport(reportData);
      
      res.status(201).json({
        status: 'success',
        data: {
          report
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a report by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getReportById(req, res, next) {
    try {
      const { id } = req.params;
      
      const report = await studentProgressReportService.getReportById(id);
      
      // Check if user is authorized to view this report
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.student && req.user.student.studentId !== report.studentId) {
          return next(new AppError('You can only view your own progress reports', 403));
        }
        
        if (req.user.parent) {
          const canAccess = await studentProgressReportService.canParentAccessReport(
            req.user.parent.parentId,
            report.studentId,
            id
          );
          
          if (!canAccess) {
            return next(new AppError('You do not have access to this progress report', 403));
          }
        }
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          report
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all reports for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentReports(req, res, next) {
    try {
      const { studentId } = req.params;
      const { courseId, classId, teacherId, reportType, startDate, endDate } = req.query;
      
      // Check if user is authorized to view these reports
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.student && req.user.student.studentId !== parseInt(studentId)) {
          return next(new AppError('You can only view your own progress reports', 403));
        }
        
        if (req.user.parent) {
          const hasAccess = await parentAccessSettingsService.checkAccess(
            req.user.parent.parentId,
            parseInt(studentId),
            'canAccessProgressReports'
          );
          
          if (!hasAccess) {
            return next(new AppError('You do not have access to these progress reports', 403));
          }
        }
      }
      
      const filters = {
        courseId: courseId ? parseInt(courseId) : undefined,
        classId: classId ? parseInt(classId) : undefined,
        teacherId: teacherId ? parseInt(teacherId) : undefined,
        reportType,
        startDate,
        endDate
      };
      
      const reports = await studentProgressReportService.getStudentReports(studentId, filters);
      
      res.status(200).json({
        status: 'success',
        results: reports.length,
        data: {
          reports
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all reports created by a teacher
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTeacherReports(req, res, next) {
    try {
      const { teacherId } = req.params;
      const { studentId, courseId, classId, reportType, startDate, endDate } = req.query;
      
      // Check if user is authorized to view these reports
      if (req.user.role !== 'admin' && req.user.teacher && req.user.teacher.teacherId !== parseInt(teacherId)) {
        return next(new AppError('You can only view reports you have created', 403));
      }
      
      const filters = {
        studentId: studentId ? parseInt(studentId) : undefined,
        courseId: courseId ? parseInt(courseId) : undefined,
        classId: classId ? parseInt(classId) : undefined,
        reportType,
        startDate,
        endDate
      };
      
      const reports = await studentProgressReportService.getTeacherReports(teacherId, filters);
      
      res.status(200).json({
        status: 'success',
        results: reports.length,
        data: {
          reports
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateReport(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateStudentProgressReport(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the report to check ownership
      const report = await studentProgressReportService.getReportById(id);
      
      // Check if user is authorized to update this report
      if (req.user.role !== 'admin' && req.user.teacher && req.user.teacher.teacherId !== report.teacherId) {
        return next(new AppError('You can only update reports you have created', 403));
      }
      
      const updatedReport = await studentProgressReportService.updateReport(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          report: updatedReport
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteReport(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the report to check ownership
      const report = await studentProgressReportService.getReportById(id);
      
      // Check if user is authorized to delete this report
      if (req.user.role !== 'admin' && req.user.teacher && req.user.teacher.teacherId !== report.teacherId) {
        return next(new AppError('You can only delete reports you have created', 403));
      }
      
      await studentProgressReportService.deleteReport(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generate a comprehensive progress report for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async generateComprehensiveReport(req, res, next) {
    try {
      const { studentId } = req.params;
      const { courseId, classId, startDate, endDate, includeGrades, includeAttendance, includeBehavior } = req.query;
      
      // Check if user is authorized to view this report
      if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        if (req.user.student && req.user.student.studentId !== parseInt(studentId)) {
          return next(new AppError('You can only view your own progress reports', 403));
        }
        
        if (req.user.parent) {
          const hasAccess = await parentAccessSettingsService.checkAccess(
            req.user.parent.parentId,
            parseInt(studentId),
            'canAccessProgressReports'
          );
          
          if (!hasAccess) {
            return next(new AppError('You do not have access to these progress reports', 403));
          }
        }
      }
      
      const options = {
        courseId: courseId ? parseInt(courseId) : undefined,
        classId: classId ? parseInt(classId) : undefined,
        startDate,
        endDate,
        includeGrades: includeGrades === 'true',
        includeAttendance: includeAttendance === 'true',
        includeBehavior: includeBehavior === 'true'
      };
      
      const reportData = await studentProgressReportService.generateComprehensiveReport(studentId, options);
      
      res.status(200).json({
        status: 'success',
        data: {
          report: reportData
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = studentProgressReportController;
