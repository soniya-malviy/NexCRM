const jwt = require('jsonwebtoken');
const config = require('../config');

const initializeSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      socket.userId = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      socket.userId = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId || 'anonymous'}`);
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('join:channel', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('leave:channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('typing:start', (data) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit('user:typing', {
          userId: socket.userId,
          channelId: data.channelId,
        });
      }
    });

    socket.on('typing:stop', (data) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit('user:stopTyping', {
          userId: socket.userId,
          channelId: data.channelId,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId || 'anonymous'}`);
    });
  });
};

module.exports = initializeSocket;