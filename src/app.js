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

// Trust proxy - IMPORTANT for deployment behind proxies (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security middleware with relaxed CSP for our application
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      connectSrc: ["'self'", "https://api.cloudinary.com", "https://res.cloudinary.com"]
    }
  }
}));

// CORS configuration - Allow access from deployment URL
const allowedOrigins = [
  config.CLIENT_URL,
  'http://localhost:3000',
  'https://reverse-qr-share.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Upload-Id', 'X-Chunk-Index']
}));

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - serve from public directory with proper options
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath, {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true,
  setHeaders: (res, filepath) => {
    // Set proper content types
    if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Log static file requests for debugging
app.use((req, res, next) => {
  if (req.path.startsWith('/css/') || req.path.startsWith('/js/')) {
    logger.debug(`Static file request: ${req.path}`);
  }
  next();
});

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
  res.sendFile(path.join(publicPath, 'receiver.html'));
});

app.get('/send/:sessionId', (req, res) => {
  res.sendFile(path.join(publicPath, 'sender.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl
  });
});

// 404 handler for other routes
app.use('*', (req, res) => {
  // If it's a file request that doesn't exist, return 404
  if (req.path.match(/\.(css|js|jpg|png|gif|ico|svg)$/)) {
    logger.warn(`Static file not found: ${req.path}`);
    return res.status(404).send('File not found');
  }

  // Otherwise send the main page
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Global error handler
app.use(errorHandler);

module.exports = app;