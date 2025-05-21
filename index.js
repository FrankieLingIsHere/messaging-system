const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Make the database available globally
global.db = pool;

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to authentication routes
app.use('/api/auth', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make socket.io available globally
global.io = io;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
