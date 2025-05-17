const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { 
  TeacherProfiles, 
  TeacherServices, 
  ServiceBookings,
  ServiceReviews,
  TeacherAvailability,
  Users,
  Teachers,
  Students
} = models;

const marketplaceService = {
  /**
   * Create a new teacher service
   * @param {Object} serviceData - The service data
   * @returns {Promise<Object>} - The created service
   */
  async createTeacherService(serviceData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create the service
      const service = await TeacherServices.create({
        teacherId: serviceData.teacherId,
        title: serviceData.title,
        description: serviceData.description,
        category: serviceData.category,
        subcategory: serviceData.subcategory,
        price: serviceData.price,
        currency: serviceData.currency || 'USD',
        duration: serviceData.duration,
        durationUnit: serviceData.durationUnit,
        isPublished: serviceData.isPublished || false,
        tags: serviceData.tags,
        requirements: serviceData.requirements,
        deliverables: serviceData.deliverables
      }, { transaction });
      
      await transaction.commit();
      
      // Return the service with associations
      return this.getServiceById(service.serviceId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(`Error creating teacher service: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a service by ID
   * @param {number} serviceId - The service ID
   * @returns {Promise<Object>} - The service
   */
  async getServiceById(serviceId) {
    try {
      const service = await TeacherServices.findByPk(serviceId, {
        include: [
          {
            model: Teachers,
            as: 'teacher',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              },
              {
                model: TeacherProfiles,
                as: 'profile'
              }
            ]
          },
          {
            model: ServiceReviews,
            as: 'reviews',
            include: [
              {
                model: Users,
                as: 'reviewer',
                attributes: ['userId', 'firstName', 'lastName']
              }
            ]
          }
        ]
      });
      
      if (!service) {
        throw new AppError('Service not found', 404);
      }
      
      return service;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving service: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all services with optional filtering
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The services
   */
  async getAllServices(filters = {}) {
    try {
      const {
        teacherId,
        category,
        subcategory,
        minPrice,
        maxPrice,
        searchQuery,
        isPublished,
        sortBy,
        sortOrder,
        limit,
        offset
      } = filters;
      
      // Build the where clause
      const where = {};
      
      if (teacherId) {
        where.teacherId = teacherId;
      }
      
      if (category) {
        where.category = category;
      }
      
      if (subcategory) {
        where.subcategory = subcategory;
      }
      
      if (isPublished !== undefined) {
        where.isPublished = isPublished;
      }
      
      if (minPrice !== undefined) {
        where.price = { ...(where.price || {}), [Op.gte]: minPrice };
      }
      
      if (maxPrice !== undefined) {
        where.price = { ...(where.price || {}), [Op.lte]: maxPrice };
      }
      
      if (searchQuery) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${searchQuery}%` } },
          { description: { [Op.iLike]: `%${searchQuery}%` } },
          { tags: { [Op.contains]: [searchQuery] } }
        ];
      }
      
      const services = await TeacherServices.findAll({
        where,
        include: [
          {
            model: Teachers,
            as: 'teacher',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName']
              },
              {
                model: TeacherProfiles,
                as: 'profile'
              }
            ]
          }
        ],
        order: [[sortBy || 'createdAt', sortOrder || 'DESC']],
        limit: limit || 10,
        offset: offset || 0
      });
      
      return services;
    } catch (error) {
      throw new AppError(`Error retrieving services: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a service
   * @param {number} serviceId - The service ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated service
   */
  async updateService(serviceId, updateData) {
    try {
      const service = await TeacherServices.findByPk(serviceId);
      
      if (!service) {
        throw new AppError('Service not found', 404);
      }
      
      // Update the service
      await service.update(updateData);
      
      // Return the updated service with associations
      return this.getServiceById(serviceId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating service: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a service
   * @param {number} serviceId - The service ID
   * @returns {Promise<void>}
   */
  async deleteService(serviceId) {
    const transaction = await sequelize.transaction();
    
    try {
      const service = await TeacherServices.findByPk(serviceId);
      
      if (!service) {
        await transaction.rollback();
        throw new AppError('Service not found', 404);
      }
      
      // Check if there are any active bookings
      const activeBookings = await ServiceBookings.count({
        where: {
          serviceId,
          status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] }
        },
        transaction
      });
      
      if (activeBookings > 0) {
        await transaction.rollback();
        throw new AppError('Cannot delete service with active bookings', 400);
      }
      
      // Delete the service
      await service.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting service: ${error.message}`, 500);
    }
  },
  
  /**
   * Book a service
   * @param {Object} bookingData - The booking data
   * @returns {Promise<Object>} - The created booking
   */
  async bookService(bookingData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if the service exists
      const service = await TeacherServices.findByPk(bookingData.serviceId, { transaction });
      
      if (!service) {
        await transaction.rollback();
        throw new AppError('Service not found', 404);
      }
      
      // Check if the service is published
      if (!service.isPublished) {
        await transaction.rollback();
        throw new AppError('Service is not available for booking', 400);
      }
      
      // Check if the student exists
      const student = await Students.findByPk(bookingData.studentId, { transaction });
      
      if (!student) {
        await transaction.rollback();
        throw new AppError('Student not found', 404);
      }
      
      // Check if the requested time slot is available
      if (bookingData.startTime && bookingData.endTime) {
        const isAvailable = await this.checkTeacherAvailability(
          service.teacherId,
          bookingData.startTime,
          bookingData.endTime,
          { transaction }
        );
        
        if (!isAvailable) {
          await transaction.rollback();
          throw new AppError('The requested time slot is not available', 400);
        }
      }
      
      // Create the booking
      const booking = await ServiceBookings.create({
        serviceId: bookingData.serviceId,
        studentId: bookingData.studentId,
        teacherId: service.teacherId,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: 'pending',
        price: service.price,
        currency: service.currency,
        notes: bookingData.notes,
        requirements: bookingData.requirements
      }, { transaction });
      
      // Update teacher availability
      if (bookingData.startTime && bookingData.endTime) {
        await TeacherAvailability.create({
          teacherId: service.teacherId,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          isBooked: true,
          bookingId: booking.bookingId
        }, { transaction });
      }
      
      await transaction.commit();
      
      // Return the booking with associations
      return this.getBookingById(booking.bookingId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error booking service: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a booking by ID
   * @param {number} bookingId - The booking ID
   * @returns {Promise<Object>} - The booking
   */
  async getBookingById(bookingId) {
    try {
      const booking = await ServiceBookings.findByPk(bookingId, {
        include: [
          {
            model: TeacherServices,
            as: 'service'
          },
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: Teachers,
            as: 'teacher',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          }
        ]
      });
      
      if (!booking) {
        throw new AppError('Booking not found', 404);
      }
      
      return booking;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving booking: ${error.message}`, 500);
    }
  },
  
  /**
   * Update booking status
   * @param {number} bookingId - The booking ID
   * @param {string} status - The new status
   * @param {Object} updateData - Additional data to update
   * @returns {Promise<Object>} - The updated booking
   */
  async updateBookingStatus(bookingId, status, updateData = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      const booking = await ServiceBookings.findByPk(bookingId, { transaction });
      
      if (!booking) {
        await transaction.rollback();
        throw new AppError('Booking not found', 404);
      }
      
      // Validate status transition
      const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [],
        cancelled: []
      };
      
      if (!validTransitions[booking.status].includes(status)) {
        await transaction.rollback();
        throw new AppError(`Invalid status transition from ${booking.status} to ${status}`, 400);
      }
      
      // Update the booking
      await booking.update({
        status,
        ...updateData
      }, { transaction });
      
      // If cancelled, free up the teacher's availability
      if (status === 'cancelled' && booking.startTime && booking.endTime) {
        await TeacherAvailability.update(
          { isBooked: false, bookingId: null },
          {
            where: {
              teacherId: booking.teacherId,
              startTime: booking.startTime,
              endTime: booking.endTime,
              bookingId: bookingId
            },
            transaction
          }
        );
      }
      
      await transaction.commit();
      
      // Return the updated booking with associations
      return this.getBookingById(bookingId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating booking status: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all bookings for a teacher
   * @param {number} teacherId - The teacher ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The bookings
   */
  async getTeacherBookings(teacherId, filters = {}) {
    try {
      const { status, startDate, endDate } = filters;
      
      // Build the where clause
      const where = { teacherId };
      
      if (status) {
        where.status = status;
      }
      
      if (startDate) {
        where.startTime = { ...(where.startTime || {}), [Op.gte]: startDate };
      }
      
      if (endDate) {
        where.endTime = { ...(where.endTime || {}), [Op.lte]: endDate };
      }
      
      const bookings = await ServiceBookings.findAll({
        where,
        include: [
          {
            model: TeacherServices,
            as: 'service'
          },
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
          }
        ],
        order: [['startTime', 'ASC']]
      });
      
      return bookings;
    } catch (error) {
      throw new AppError(`Error retrieving teacher bookings: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all bookings for a student
   * @param {number} studentId - The student ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The bookings
   */
  async getStudentBookings(studentId, filters = {}) {
    try {
      const { status, startDate, endDate } = filters;
      
      // Build the where clause
      const where = { studentId };
      
      if (status) {
        where.status = status;
      }
      
      if (startDate) {
        where.startTime = { ...(where.startTime || {}), [Op.gte]: startDate };
      }
      
      if (endDate) {
        where.endTime = { ...(where.endTime || {}), [Op.lte]: endDate };
      }
      
      const bookings = await ServiceBookings.findAll({
        where,
        include: [
          {
            model: TeacherServices,
            as: 'service'
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
        ],
        order: [['startTime', 'ASC']]
      });
      
      return bookings;
    } catch (error) {
      throw new AppError(`Error retrieving student bookings: ${error.message}`, 500);
    }
  },
  
  /**
   * Check teacher availability
   * @param {number} teacherId - The teacher ID
   * @param {Date} startTime - The start time
   * @param {Date} endTime - The end time
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} - True if the teacher is available
   */
  async checkTeacherAvailability(teacherId, startTime, endTime, options = {}) {
    try {
      // Check if the teacher has any bookings during this time
      const conflictingBookings = await TeacherAvailability.count({
        where: {
          teacherId,
          isBooked: true,
          [Op.or]: [
            {
              // Starts during an existing booking
              startTime: { [Op.lt]: endTime },
              endTime: { [Op.gt]: startTime }
            },
            {
              // Ends during an existing booking
              startTime: { [Op.lt]: endTime },
              endTime: { [Op.gt]: startTime }
            },
            {
              // Completely contains an existing booking
              startTime: { [Op.gte]: startTime },
              endTime: { [Op.lte]: endTime }
            },
            {
              // Is completely contained by an existing booking
              startTime: { [Op.lte]: startTime },
              endTime: { [Op.gte]: endTime }
            }
          ]
        },
        ...options
      });
      
      return conflictingBookings === 0;
    } catch (error) {
      throw new AppError(`Error checking teacher availability: ${error.message}`, 500);
    }
  },
  
  /**
   * Set teacher availability
   * @param {number} teacherId - The teacher ID
   * @param {Array} availabilitySlots - The availability slots
   * @returns {Promise<Array>} - The created availability slots
   */
  async setTeacherAvailability(teacherId, availabilitySlots) {
    const transaction = await sequelize.transaction();
    
    try {
      // Delete existing availability slots that are not booked
      await TeacherAvailability.destroy({
        where: {
          teacherId,
          isBooked: false
        },
        transaction
      });
      
      // Create new availability slots
      const slots = await Promise.all(
        availabilitySlots.map(slot => 
          TeacherAvailability.create({
            teacherId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: false
          }, { transaction })
        )
      );
      
      await transaction.commit();
      
      return slots;
    } catch (error) {
      await transaction.rollback();
      throw new AppError(`Error setting teacher availability: ${error.message}`, 500);
    }
  },
  
  /**
   * Get teacher availability
   * @param {number} teacherId - The teacher ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The availability slots
   */
  async getTeacherAvailability(teacherId, filters = {}) {
    try {
      const { startDate, endDate, isBooked } = filters;
      
      // Build the where clause
      const where = { teacherId };
      
      if (startDate) {
        where.startTime = { ...(where.startTime || {}), [Op.gte]: startDate };
      }
      
      if (endDate) {
        where.endTime = { ...(where.endTime || {}), [Op.lte]: endDate };
      }
      
      if (isBooked !== undefined) {
        where.isBooked = isBooked;
      }
      
      const availabilitySlots = await TeacherAvailability.findAll({
        where,
        order: [['startTime', 'ASC']]
      });
      
      return availabilitySlots;
    } catch (error) {
      throw new AppError(`Error retrieving teacher availability: ${error.message}`, 500);
    }
  }
};

module.exports = marketplaceService;
