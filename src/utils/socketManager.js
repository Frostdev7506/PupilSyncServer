const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const AppError = require('./errors/AppError');

const models = initModels(sequelize);
const { Users, ChatParticipants } = models;

let io;

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 */
const initialize = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await Users.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId}`);
    
    // Join user's personal room
    socket.join(`user:${socket.user.userId}`);
    
    // Handle joining chat rooms
    socket.on('joinChatRoom', async (chatId) => {
      try {
        // Check if user is a participant in the chat
        const participant = await ChatParticipants.findOne({
          where: {
            chatId,
            userId: socket.user.userId
          }
        });
        
        if (!participant) {
          socket.emit('error', { message: 'You are not a participant in this chat' });
          return;
        }
        
        // Join the chat room
        socket.join(`chat:${chatId}`);
        console.log(`User ${socket.user.userId} joined chat room ${chatId}`);
        
        // Notify other participants
        socket.to(`chat:${chatId}`).emit('userJoined', {
          chatId,
          user: {
            userId: socket.user.userId,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName
          }
        });
      } catch (error) {
        socket.emit('error', { message: 'Error joining chat room' });
      }
    });
    
    // Handle leaving chat rooms
    socket.on('leaveChatRoom', (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${socket.user.userId} left chat room ${chatId}`);
      
      // Notify other participants
      socket.to(`chat:${chatId}`).emit('userLeft', {
        chatId,
        user: {
          userId: socket.user.userId,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      const { chatId } = data;
      
      socket.to(`chat:${chatId}`).emit('userTyping', {
        chatId,
        user: {
          userId: socket.user.userId,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });
    });
    
    // Handle stop typing indicators
    socket.on('stopTyping', (data) => {
      const { chatId } = data;
      
      socket.to(`chat:${chatId}`).emit('userStoppedTyping', {
        chatId,
        user: {
          userId: socket.user.userId,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.userId}`);
    });
  });
};

/**
 * Emit an event to a specific room
 * @param {string} room - The room to emit to
 * @param {string} event - The event name
 * @param {Object} data - The data to emit
 */
const emitToRoom = (room, event, data) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }
  
  io.to(room).emit(event, data);
};

/**
 * Emit an event to a specific user
 * @param {number} userId - The user ID
 * @param {string} event - The event name
 * @param {Object} data - The data to emit
 */
const emitToUser = (userId, event, data) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }
  
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit an event to all connected clients
 * @param {string} event - The event name
 * @param {Object} data - The data to emit
 */
const emitToAll = (event, data) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }
  
  io.emit(event, data);
};

/**
 * Get the Socket.IO instance
 * @returns {Object} - The Socket.IO instance
 */
const getIo = () => {
  if (!io) {
    throw new AppError('Socket.IO not initialized', 500);
  }
  
  return io;
};

module.exports = {
  initialize,
  emitToRoom,
  emitToUser,
  emitToAll,
  getIo
};
