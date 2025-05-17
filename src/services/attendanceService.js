const { Op, Sequelize } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { Attendance, Students, Classes, Users } = models;

const attendanceService = {
  /**
   * Create a new attendance record
   * @param {Object} attendanceData - The attendance data
   * @returns {Promise<Object>} - The created attendance record
   */
  async createAttendance(attendanceData) {
    try {
      const attendance = await Attendance.create(attendanceData);
      return attendance;
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Create multiple attendance records in a single transaction
   * @param {Array} attendanceRecords - Array of attendance records
   * @returns {Promise<Array>} - The created attendance records
   */
  async createBulkAttendance(attendanceRecords) {
    const transaction = await sequelize.transaction();
    try {
      const attendances = await Attendance.bulkCreate(attendanceRecords, { transaction });
      await transaction.commit();
      return attendances;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get attendance record by ID
   * @param {number} attendanceId - The attendance ID
   * @returns {Promise<Object>} - The attendance record
   */
  async getAttendanceById(attendanceId) {
    const attendance = await Attendance.findByPk(attendanceId, {
      include: [
        { model: Students, as: 'student', include: [{ model: Users, as: 'user' }] },
        { model: Classes, as: 'class' },
        { model: Users, as: 'markedBy' }
      ]
    });

    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }

    return attendance;
  },

  /**
   * Get attendance records by student ID
   * @param {number} studentId - The student ID
   * @param {Object} options - Query options (date range, status, etc.)
   * @returns {Promise<Array>} - The attendance records
   */
  async getAttendanceByStudent(studentId, options = {}) {
    const { startDate, endDate, status, classId } = options;
    
    const whereClause = { studentId };
    
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.date = {
        [Op.lte]: endDate
      };
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (classId) {
      whereClause.classId = classId;
    }
    
    const attendance = await Attendance.findAll({
      where: whereClause,
      include: [
        { model: Classes, as: 'class' },
        { model: Users, as: 'markedBy' }
      ],
      order: [['date', 'DESC']]
    });
    
    return attendance;
  },

  /**
   * Get attendance records by class ID
   * @param {number} classId - The class ID
   * @param {Object} options - Query options (date, status, etc.)
   * @returns {Promise<Array>} - The attendance records
   */
  async getAttendanceByClass(classId, options = {}) {
    const { date, status, studentId } = options;
    
    const whereClause = { classId };
    
    if (date) {
      whereClause.date = date;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (studentId) {
      whereClause.studentId = studentId;
    }
    
    const attendance = await Attendance.findAll({
      where: whereClause,
      include: [
        { model: Students, as: 'student', include: [{ model: Users, as: 'user' }] },
        { model: Users, as: 'markedBy' }
      ],
      order: [['date', 'DESC'], [{ model: Students, as: 'student' }, { model: Users, as: 'user' }, 'lastName', 'ASC']]
    });
    
    return attendance;
  },

  /**
   * Update an attendance record
   * @param {number} attendanceId - The attendance ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated attendance record
   */
  async updateAttendance(attendanceId, updateData) {
    const attendance = await Attendance.findByPk(attendanceId);
    
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }
    
    await attendance.update(updateData);
    
    return attendance;
  },

  /**
   * Delete an attendance record
   * @param {number} attendanceId - The attendance ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteAttendance(attendanceId) {
    const attendance = await Attendance.findByPk(attendanceId);
    
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }
    
    await attendance.destroy();
    
    return true;
  },

  /**
   * Get attendance statistics for a student
   * @param {number} studentId - The student ID
   * @param {Object} options - Query options (date range, classId, etc.)
   * @returns {Promise<Object>} - The attendance statistics
   */
  async getStudentAttendanceStats(studentId, options = {}) {
    const { startDate, endDate, classId } = options;
    
    const whereClause = { studentId };
    
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.date = {
        [Op.lte]: endDate
      };
    }
    
    if (classId) {
      whereClause.classId = classId;
    }
    
    const stats = await Attendance.findAll({
      where: whereClause,
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
      ],
      group: ['status']
    });
    
    const totalDays = stats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0);
    
    const result = {
      totalDays,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      presentPercentage: 0,
      absentPercentage: 0,
      latePercentage: 0,
      excusedPercentage: 0
    };
    
    stats.forEach(stat => {
      const count = parseInt(stat.dataValues.count);
      result[stat.status] = count;
      result[`${stat.status}Percentage`] = totalDays > 0 ? (count / totalDays) * 100 : 0;
    });
    
    return result;
  }
};

module.exports = attendanceService;
