const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimitMiddleware = require('./middleware/rateLimit');

// Import routes
const apiRoutes = require('./routes/api');

const app = express();

// Security middleware with relaxed CSP for our application
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"], // This blocks inline event handlers, which is good - we're using event listeners instead
      connectSrc: ["'self'", "https://api.cloudinary.com", "https://res.cloudinary.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Upload-Id', 'X-Chunk-Index']
}));

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
  req.startTime = Date.now();
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rate limiting
app.use(rateLimitMiddleware);

// API routes
app.use('/api', apiRoutes);

// Serve frontend routes
app.get('/receive', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/receiver.html'));
});

app.get('/send/:sessionId', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sender.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;