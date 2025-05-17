const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const socketManager = require('../utils/socketManager');

const models = initModels(sequelize);
const { 
  Polls, 
  PollOptions, 
  PollResponses,
  Courses,
  Classes,
  Teachers,
  Students,
  Users
} = models;

const pollService = {
  /**
   * Create a new poll
   * @param {Object} pollData - The poll data
   * @returns {Promise<Object>} - The created poll
   */
  async createPoll(pollData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create the poll
      const poll = await Polls.create({
        title: pollData.title,
        question: pollData.question,
        courseId: pollData.courseId,
        classId: pollData.classId,
        teacherId: pollData.teacherId,
        isAnonymous: pollData.isAnonymous || false,
        isMultipleChoice: pollData.isMultipleChoice || false,
        isActive: pollData.isActive || true,
        expiresAt: pollData.expiresAt
      }, { transaction });
      
      // If options are provided, create them
      if (pollData.options && Array.isArray(pollData.options)) {
        for (const [index, optionData] of pollData.options.entries()) {
          await PollOptions.create({
            pollId: poll.pollId,
            text: optionData.text,
            orderNumber: index + 1
          }, { transaction });
        }
      }
      
      await transaction.commit();
      
      // Get the poll with options
      const createdPoll = await this.getPollById(poll.pollId);
      
      // Notify connected clients if the poll is active
      if (createdPoll.isActive) {
        if (createdPoll.courseId) {
          socketManager.emitToRoom(`course:${createdPoll.courseId}`, 'poll:created', {
            pollId: createdPoll.pollId,
            title: createdPoll.title,
            question: createdPoll.question
          });
        }
        
        if (createdPoll.classId) {
          socketManager.emitToRoom(`class:${createdPoll.classId}`, 'poll:created', {
            pollId: createdPoll.pollId,
            title: createdPoll.title,
            question: createdPoll.question
          });
        }
      }
      
      return createdPoll;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(`Error creating poll: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a poll by ID
   * @param {number} pollId - The poll ID
   * @param {boolean} includeResponses - Whether to include responses
   * @returns {Promise<Object>} - The poll
   */
  async getPollById(pollId, includeResponses = false) {
    try {
      const includes = [
        {
          model: PollOptions,
          as: 'options',
          order: [['orderNumber', 'ASC']]
        },
        {
          model: Teachers,
          as: 'teacher',
          include: [
            {
              model: Users,
              as: 'user',
              attributes: ['userId', 'firstName', 'lastName']
            }
          ]
        }
      ];
      
      if (includeResponses) {
        includes.push({
          model: PollResponses,
          as: 'responses',
          include: [
            {
              model: Students,
              as: 'student',
              include: [
                {
                  model: Users,
                  as: 'user',
                  attributes: ['userId', 'firstName', 'lastName']
                }
              ]
            },
            {
              model: PollOptions,
              as: 'option'
            }
          ]
        });
      }
      
      const poll = await Polls.findByPk(pollId, {
        include: includes
      });
      
      if (!poll) {
        throw new AppError('Poll not found', 404);
      }
      
      return poll;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving poll: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all polls for a teacher
   * @param {number} teacherId - The teacher ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The polls
   */
  async getPollsByTeacher(teacherId, filters = {}) {
    try {
      const { courseId, classId, isActive } = filters;
      
      // Build the where clause
      const where = { teacherId };
      
      if (courseId) {
        where.courseId = courseId;
      }
      
      if (classId) {
        where.classId = classId;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive;
      }
      
      const polls = await Polls.findAll({
        where,
        include: [
          {
            model: PollOptions,
            as: 'options'
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return polls;
    } catch (error) {
      throw new AppError(`Error retrieving polls: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all active polls for a course or class
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The polls
   */
  async getActivePolls(filters = {}) {
    try {
      const { courseId, classId } = filters;
      
      // Build the where clause
      const where = { 
        isActive: true,
        [Op.or]: []
      };
      
      if (courseId) {
        where[Op.or].push({ courseId });
      }
      
      if (classId) {
        where[Op.or].push({ classId });
      }
      
      // If neither courseId nor classId is provided, return an empty array
      if (where[Op.or].length === 0) {
        return [];
      }
      
      // Add expiration check
      where[Op.or] = {
        [Op.and]: [
          { [Op.or]: where[Op.or] },
          {
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: new Date() } }
            ]
          }
        ]
      };
      
      const polls = await Polls.findAll({
        where,
        include: [
          {
            model: PollOptions,
            as: 'options',
            order: [['orderNumber', 'ASC']]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return polls;
    } catch (error) {
      throw new AppError(`Error retrieving active polls: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a poll
   * @param {number} pollId - The poll ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated poll
   */
  async updatePoll(pollId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const poll = await Polls.findByPk(pollId, { transaction });
      
      if (!poll) {
        await transaction.rollback();
        throw new AppError('Poll not found', 404);
      }
      
      // Check if there are any responses
      const responseCount = await PollResponses.count({
        where: { pollId },
        transaction
      });
      
      // If there are responses, only certain fields can be updated
      if (responseCount > 0) {
        const allowedUpdates = ['title', 'isActive', 'expiresAt'];
        const attemptedUpdates = Object.keys(updateData);
        
        for (const field of attemptedUpdates) {
          if (!allowedUpdates.includes(field)) {
            await transaction.rollback();
            throw new AppError(`Cannot update ${field} after responses have been received`, 400);
          }
        }
      }
      
      // Update the poll
      await poll.update(updateData, { transaction });
      
      // If options are provided and there are no responses, update them
      if (updateData.options && Array.isArray(updateData.options) && responseCount === 0) {
        // Delete existing options
        await PollOptions.destroy({
          where: { pollId },
          transaction
        });
        
        // Create new options
        for (const [index, optionData] of updateData.options.entries()) {
          await PollOptions.create({
            pollId,
            text: optionData.text,
            orderNumber: index + 1
          }, { transaction });
        }
      }
      
      await transaction.commit();
      
      // Get the updated poll with options
      const updatedPoll = await this.getPollById(pollId);
      
      // Notify connected clients if the poll status changed
      if (updateData.isActive !== undefined && updateData.isActive !== poll.isActive) {
        const eventName = updateData.isActive ? 'poll:activated' : 'poll:deactivated';
        
        if (updatedPoll.courseId) {
          socketManager.emitToRoom(`course:${updatedPoll.courseId}`, eventName, {
            pollId: updatedPoll.pollId
          });
        }
        
        if (updatedPoll.classId) {
          socketManager.emitToRoom(`class:${updatedPoll.classId}`, eventName, {
            pollId: updatedPoll.pollId
          });
        }
      }
      
      return updatedPoll;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating poll: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a poll
   * @param {number} pollId - The poll ID
   * @returns {Promise<void>}
   */
  async deletePoll(pollId) {
    const transaction = await sequelize.transaction();
    
    try {
      const poll = await Polls.findByPk(pollId, { transaction });
      
      if (!poll) {
        await transaction.rollback();
        throw new AppError('Poll not found', 404);
      }
      
      // Delete all responses
      await PollResponses.destroy({
        where: { pollId },
        transaction
      });
      
      // Delete all options
      await PollOptions.destroy({
        where: { pollId },
        transaction
      });
      
      // Delete the poll
      await poll.destroy({ transaction });
      
      await transaction.commit();
      
      // Notify connected clients if the poll was active
      if (poll.isActive) {
        if (poll.courseId) {
          socketManager.emitToRoom(`course:${poll.courseId}`, 'poll:deleted', {
            pollId: poll.pollId
          });
        }
        
        if (poll.classId) {
          socketManager.emitToRoom(`class:${poll.classId}`, 'poll:deleted', {
            pollId: poll.pollId
          });
        }
      }
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting poll: ${error.message}`, 500);
    }
  },
  
  /**
   * Submit a response to a poll
   * @param {number} pollId - The poll ID
   * @param {number} studentId - The student ID
   * @param {number|Array<number>} optionId - The option ID or array of option IDs
   * @returns {Promise<Object>} - The created response
   */
  async submitPollResponse(pollId, studentId, optionId) {
    const transaction = await sequelize.transaction();
    
    try {
      const poll = await Polls.findByPk(pollId, { transaction });
      
      if (!poll) {
        await transaction.rollback();
        throw new AppError('Poll not found', 404);
      }
      
      // Check if the poll is active
      if (!poll.isActive) {
        await transaction.rollback();
        throw new AppError('Poll is not active', 400);
      }
      
      // Check if the poll has expired
      if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
        await transaction.rollback();
        throw new AppError('Poll has expired', 400);
      }
      
      // Check if the student has already responded
      const existingResponse = await PollResponses.findOne({
        where: { pollId, studentId },
        transaction
      });
      
      if (existingResponse) {
        await transaction.rollback();
        throw new AppError('You have already responded to this poll', 400);
      }
      
      // Handle multiple choice polls
      if (poll.isMultipleChoice && Array.isArray(optionId)) {
        // Validate all option IDs
        for (const id of optionId) {
          const option = await PollOptions.findOne({
            where: { pollId, optionId: id },
            transaction
          });
          
          if (!option) {
            await transaction.rollback();
            throw new AppError(`Option with ID ${id} not found for this poll`, 404);
          }
        }
        
        // Create responses for each option
        const responses = [];
        for (const id of optionId) {
          const response = await PollResponses.create({
            pollId,
            studentId,
            optionId: id
          }, { transaction });
          
          responses.push(response);
        }
        
        await transaction.commit();
        
        // Notify connected clients
        this._notifyPollResponseSubmitted(poll, studentId);
        
        return responses;
      } else {
        // Single choice poll
        const singleOptionId = Array.isArray(optionId) ? optionId[0] : optionId;
        
        // Validate the option ID
        const option = await PollOptions.findOne({
          where: { pollId, optionId: singleOptionId },
          transaction
        });
        
        if (!option) {
          await transaction.rollback();
          throw new AppError('Option not found for this poll', 404);
        }
        
        // Create the response
        const response = await PollResponses.create({
          pollId,
          studentId,
          optionId: singleOptionId
        }, { transaction });
        
        await transaction.commit();
        
        // Notify connected clients
        this._notifyPollResponseSubmitted(poll, studentId);
        
        return response;
      }
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error submitting poll response: ${error.message}`, 500);
    }
  },
  
  /**
   * Get poll results
   * @param {number} pollId - The poll ID
   * @returns {Promise<Object>} - The poll results
   */
  async getPollResults(pollId) {
    try {
      const poll = await this.getPollById(pollId, true);
      
      // Calculate results
      const options = poll.options.map(option => {
        const responseCount = poll.responses.filter(response => 
          response.optionId === option.optionId
        ).length;
        
        return {
          optionId: option.optionId,
          text: option.text,
          responseCount,
          percentage: poll.responses.length > 0 
            ? (responseCount / poll.responses.length) * 100 
            : 0
        };
      });
      
      // Get unique respondents
      const respondentIds = [...new Set(poll.responses.map(response => response.studentId))];
      
      return {
        pollId: poll.pollId,
        title: poll.title,
        question: poll.question,
        isAnonymous: poll.isAnonymous,
        isMultipleChoice: poll.isMultipleChoice,
        totalResponses: poll.responses.length,
        uniqueRespondents: respondentIds.length,
        options
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving poll results: ${error.message}`, 500);
    }
  },
  
  /**
   * Notify clients that a poll response was submitted
   * @param {Object} poll - The poll
   * @param {number} studentId - The student ID
   * @private
   */
  _notifyPollResponseSubmitted(poll, studentId) {
    // Notify teacher
    socketManager.emitToUser(poll.teacherId, 'poll:response', {
      pollId: poll.pollId,
      studentId
    });
    
    // Notify course/class about updated response count (not who responded)
    if (poll.courseId) {
      socketManager.emitToRoom(`course:${poll.courseId}`, 'poll:responseReceived', {
        pollId: poll.pollId
      });
    }
    
    if (poll.classId) {
      socketManager.emitToRoom(`class:${poll.classId}`, 'poll:responseReceived', {
        pollId: poll.pollId
      });
    }
  }
};

module.exports = pollService;
