require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const config = require('./config');
const { limiter } = require('./middlewares/rateLimit');
const initializeSocket = require('./sockets');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const dealRoutes = require('./routes/deals');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const ticketRoutes = require('./routes/tickets');

require('./services/cronService');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
    credentials: false,
  },
});

app.use(cors({
  origin: "*",
  credentials: false,
}));
app.use(express.json());
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.set('io', io);
initializeSocket(io);

const startServer = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');

    const { Channel } = require('./models/Message');
    const defaultChannels = ['Admin Group', 'Sales Group', 'Support Group'];
    for (const name of defaultChannels) {
      const exists = await Channel.findOne({ name });
      if (!exists) {
        await Channel.create({ name, type: 'public', description: `${name} General Chat` });
      }
    }

    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();