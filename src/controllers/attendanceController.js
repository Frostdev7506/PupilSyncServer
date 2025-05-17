const attendanceService = require('../services/attendanceService');
const AppError = require('../utils/errors/AppError');

const attendanceController = {
  /**
   * Create a new attendance record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createAttendance(req, res, next) {
    try {
      const attendanceData = {
        ...req.body,
        markedById: req.user.userId // Set the current user as the one who marked attendance
      };
      
      const attendance = await attendanceService.createAttendance(attendanceData);
      
      res.status(201).json({
        status: 'success',
        data: {
          attendance
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create multiple attendance records in a single request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createBulkAttendance(req, res, next) {
    try {
      const { attendanceRecords } = req.body;
      
      if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
        return next(new AppError('Please provide an array of attendance records', 400));
      }
      
      // Add the current user as the one who marked attendance for all records
      const recordsWithMarker = attendanceRecords.map(record => ({
        ...record,
        markedById: req.user.userId
      }));
      
      const attendances = await attendanceService.createBulkAttendance(recordsWithMarker);
      
      res.status(201).json({
        status: 'success',
        data: {
          count: attendances.length,
          attendances
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get attendance record by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAttendanceById(req, res, next) {
    try {
      const { id } = req.params;
      
      const attendance = await attendanceService.getAttendanceById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          attendance
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get attendance records by student ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAttendanceByStudent(req, res, next) {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, status, classId } = req.query;
      
      const options = {
        startDate,
        endDate,
        status,
        classId: classId ? parseInt(classId) : undefined
      };
      
      const attendance = await attendanceService.getAttendanceByStudent(studentId, options);
      
      res.status(200).json({
        status: 'success',
        results: attendance.length,
        data: {
          attendance
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get attendance records by class ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAttendanceByClass(req, res, next) {
    try {
      const { classId } = req.params;
      const { date, status, studentId } = req.query;
      
      const options = {
        date,
        status,
        studentId: studentId ? parseInt(studentId) : undefined
      };
      
      const attendance = await attendanceService.getAttendanceByClass(classId, options);
      
      res.status(200).json({
        status: 'success',
        results: attendance.length,
        data: {
          attendance
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an attendance record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        markedById: req.user.userId // Update the marker to the current user
      };
      
      const attendance = await attendanceService.updateAttendance(id, updateData);
      
      res.status(200).json({
        status: 'success',
        data: {
          attendance
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an attendance record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteAttendance(req, res, next) {
    try {
      const { id } = req.params;
      
      await attendanceService.deleteAttendance(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get attendance statistics for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentAttendanceStats(req, res, next) {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, classId } = req.query;
      
      const options = {
        startDate,
        endDate,
        classId: classId ? parseInt(classId) : undefined
      };
      
      const stats = await attendanceService.getStudentAttendanceStats(studentId, options);
      
      res.status(200).json({
        status: 'success',
        data: {
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = attendanceController;
