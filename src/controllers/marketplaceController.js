const marketplaceService = require('../services/marketplaceService');
const AppError = require('../utils/errors/AppError');
const { validateTeacherService, validateServiceBooking, validateTeacherAvailability } = require('../utils/validators/marketplaceValidator');
const paramParser = require('../utils/paramParser');

const marketplaceController = {
  /**
   * Create a new teacher service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createTeacherService(req, res, next) {
    try {
      // Validate request body
      const { error } = validateTeacherService(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }

      // Check if user is a teacher
      if (!req.user.teacher) {
        return next(new AppError('Only teachers can create services', 403));
      }
      
      // Set the current teacher as the creator
      const serviceData = {
        ...req.body,
        teacherId: req.user.teacher.teacherId
      };
      
      const service = await marketplaceService.createTeacherService(serviceData);
      
      res.status(201).json({
        status: 'success',
        data: {
          service
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a service by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getServiceById(req, res, next) {
    try {
      const { id } = req.params;
      
      const service = await marketplaceService.getServiceById(parseInt(id));
      
      res.status(200).json({
        status: 'success',
        data: {
          service
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all services with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllServices(req, res, next) {
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
      } = req.query;
      
      const filters = {
        teacherId: paramParser.parseInteger(teacherId),
        category,
        subcategory,
        minPrice: paramParser.parseFloat(minPrice),
        maxPrice: paramParser.parseFloat(maxPrice),
        searchQuery,
        isPublished: paramParser.parseBoolean(isPublished),
        sortBy,
        sortOrder,
        ...paramParser.parsePagination(req.query)
      };
      
      const services = await marketplaceService.getAllServices(filters);
      
      res.status(200).json({
        status: 'success',
        results: services.length,
        data: {
          services
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateService(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateTeacherService(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to update this service
      const service = await marketplaceService.getServiceById(parseInt(id));
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== service.teacherId)) {
        return next(new AppError('You are not authorized to update this service', 403));
      }
      
      const updatedService = await marketplaceService.updateService(parseInt(id), req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          service: updatedService
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteService(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if user is authorized to delete this service
      const service = await marketplaceService.getServiceById(parseInt(id));
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== service.teacherId)) {
        return next(new AppError('You are not authorized to delete this service', 403));
      }
      
      await marketplaceService.deleteService(parseInt(id));
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Book a service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async bookService(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateServiceBooking(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is a student
      if (!req.user.student) {
        return next(new AppError('Only students can book services', 403));
      }
      
      // Set the current student as the booker
      const bookingData = {
        ...req.body,
        serviceId: parseInt(id),
        studentId: req.user.student.studentId
      };
      
      const booking = await marketplaceService.bookService(bookingData);
      
      res.status(201).json({
        status: 'success',
        data: {
          booking
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a booking by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getBookingById(req, res, next) {
    try {
      const { id } = req.params;
      
      const booking = await marketplaceService.getBookingById(parseInt(id));
      
      // Check if user is authorized to view this booking
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== booking.teacherId) && 
          (!req.user.student || req.user.student.studentId !== booking.studentId)) {
        return next(new AppError('You are not authorized to view this booking', 403));
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          booking
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update booking status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateBookingStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!status) {
        return next(new AppError('Status is required', 400));
      }
      
      // Check if status is valid
      const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
      }
      
      // Check if user is authorized to update this booking
      const booking = await marketplaceService.getBookingById(parseInt(id));
      
      // Teachers can confirm, start, complete, or cancel bookings
      // Students can only cancel bookings
      if (req.user.role !== 'admin') {
        if (req.user.teacher && req.user.teacher.teacherId === booking.teacherId) {
          // Teacher can update any status
        } else if (req.user.student && req.user.student.studentId === booking.studentId) {
          // Student can only cancel
          if (status !== 'cancelled') {
            return next(new AppError('Students can only cancel bookings', 403));
          }
        } else {
          return next(new AppError('You are not authorized to update this booking', 403));
        }
      }
      
      const updatedBooking = await marketplaceService.updateBookingStatus(
        parseInt(id),
        status,
        { notes }
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          booking: updatedBooking
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all bookings for the current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUserBookings(req, res, next) {
    try {
      const { status, startDate, endDate } = req.query;
      
      const filters = {
        status,
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate)
      };
      
      let bookings = [];
      
      if (req.user.teacher) {
        // Get teacher bookings
        bookings = await marketplaceService.getTeacherBookings(
          req.user.teacher.teacherId,
          filters
        );
      } else if (req.user.student) {
        // Get student bookings
        bookings = await marketplaceService.getStudentBookings(
          req.user.student.studentId,
          filters
        );
      } else {
        return next(new AppError('User is neither a teacher nor a student', 400));
      }
      
      res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: {
          bookings
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Set teacher availability
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async setTeacherAvailability(req, res, next) {
    try {
      const { availabilitySlots } = req.body;
      
      // Validate request body
      const { error } = validateTeacherAvailability(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is a teacher
      if (!req.user.teacher) {
        return next(new AppError('Only teachers can set availability', 403));
      }
      
      const slots = await marketplaceService.setTeacherAvailability(
        req.user.teacher.teacherId,
        availabilitySlots
      );
      
      res.status(200).json({
        status: 'success',
        results: slots.length,
        data: {
          availabilitySlots: slots
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get teacher availability
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTeacherAvailability(req, res, next) {
    try {
      const { teacherId } = req.params;
      const { startDate, endDate, isBooked } = req.query;
      
      const filters = {
        startDate: paramParser.parseDate(startDate),
        endDate: paramParser.parseDate(endDate),
        isBooked: paramParser.parseBoolean(isBooked)
      };
      
      const availabilitySlots = await marketplaceService.getTeacherAvailability(
        parseInt(teacherId),
        filters
      );
      
      res.status(200).json({
        status: 'success',
        results: availabilitySlots.length,
        data: {
          availabilitySlots
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Check teacher availability
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async checkTeacherAvailability(req, res, next) {
    try {
      const { teacherId } = req.params;
      const { startTime, endTime } = req.query;
      
      if (!startTime || !endTime) {
        return next(new AppError('Start time and end time are required', 400));
      }
      
      const isAvailable = await marketplaceService.checkTeacherAvailability(
        parseInt(teacherId),
        new Date(startTime),
        new Date(endTime)
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          isAvailable
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = marketplaceController;
