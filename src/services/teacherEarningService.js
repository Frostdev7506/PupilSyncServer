const { Op, Sequelize } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { TeacherEarnings, Teachers, Users, Courses, Students } = models;

const teacherEarningService = {
  /**
   * Create a new earning record
   * @param {Object} earningData - The earning data
   * @returns {Promise<Object>} - The created earning record
   */
  async createEarning(earningData) {
    try {
      const earning = await TeacherEarnings.create(earningData);
      return earning;
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get an earning record by ID
   * @param {number} earningId - The earning ID
   * @returns {Promise<Object>} - The earning record
   */
  async getEarningById(earningId) {
    const earning = await TeacherEarnings.findByPk(earningId, {
      include: [
        {
          model: Teachers,
          as: 'teacher',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });

    if (!earning) {
      throw new AppError('Earning record not found', 404);
    }

    return earning;
  },

  /**
   * Get all earnings for a teacher
   * @param {number} teacherId - The teacher ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of earning records
   */
  async getTeacherEarnings(teacherId, filters = {}) {
    const { status, startDate, endDate, earningType } = filters;
    
    const whereClause = { teacherId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.earnedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.earnedAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.earnedAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (earningType) {
      whereClause.earningType = earningType;
    }
    
    const earnings = await TeacherEarnings.findAll({
      where: whereClause,
      include: [
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ],
      order: [['earnedAt', 'DESC']]
    });
    
    return earnings;
  },

  /**
   * Get earnings summary for a teacher
   * @param {number} teacherId - The teacher ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Earnings summary
   */
  async getTeacherEarningsSummary(teacherId, filters = {}) {
    const { startDate, endDate } = filters;
    
    const whereClause = { teacherId };
    
    if (startDate && endDate) {
      whereClause.earnedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.earnedAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.earnedAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    // Get total earnings by status
    const totalByStatus = await TeacherEarnings.findAll({
      where: whereClause,
      attributes: [
        'status',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('earning_id')), 'count']
      ],
      group: ['status']
    });
    
    // Get total earnings by type
    const totalByType = await TeacherEarnings.findAll({
      where: whereClause,
      attributes: [
        'earningType',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('earning_id')), 'count']
      ],
      group: ['earningType']
    });
    
    // Get monthly earnings
    const monthlyEarnings = await TeacherEarnings.findAll({
      where: whereClause,
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('earned_at')), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('earning_id')), 'count']
      ],
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('earned_at'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('earned_at')), 'ASC']]
    });
    
    // Calculate overall totals
    const overallTotal = await TeacherEarnings.findOne({
      where: whereClause,
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'],
        [Sequelize.fn('COUNT', Sequelize.col('earning_id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('platform_fee')), 'totalFees'],
        [Sequelize.fn('SUM', Sequelize.col('tax_amount')), 'totalTaxes']
      ]
    });
    
    return {
      totalByStatus: totalByStatus.map(item => item.toJSON()),
      totalByType: totalByType.map(item => item.toJSON()),
      monthlyEarnings: monthlyEarnings.map(item => item.toJSON()),
      overall: overallTotal ? overallTotal.toJSON() : { totalAmount: 0, count: 0, totalFees: 0, totalTaxes: 0 }
    };
  },

  /**
   * Update an earning record
   * @param {number} earningId - The earning ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated earning record
   */
  async updateEarning(earningId, updateData) {
    const earning = await TeacherEarnings.findByPk(earningId);
    
    if (!earning) {
      throw new AppError('Earning record not found', 404);
    }
    
    // Only certain fields can be updated
    const allowedFields = ['description', 'status', 'availableAt', 'paidAt', 'paymentId'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });
    
    await earning.update(filteredData);
    
    return this.getEarningById(earningId);
  },

  /**
   * Delete an earning record
   * @param {number} earningId - The earning ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteEarning(earningId) {
    const earning = await TeacherEarnings.findByPk(earningId);
    
    if (!earning) {
      throw new AppError('Earning record not found', 404);
    }
    
    await earning.destroy();
    
    return true;
  }
};

module.exports = teacherEarningService;
