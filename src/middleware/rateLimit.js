const rateLimit = require('express-rate-limit');
const config = require('../config');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX, // requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Stricter rate limiting for session creation
const sessionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 session creations per window
  message: {
    error: 'Too many session creation attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 upload requests per window
  message: {
    error: 'Too many upload requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply different limits based on route
const rateLimitMiddleware = (req, res, next) => {
  if (req.path === '/api/session' && req.method === 'POST') {
    return sessionLimiter(req, res, next);
  }

  if (req.path.startsWith('/api/upload')) {
    return uploadLimiter(req, res, next);
  }

  return generalLimiter(req, res, next);
};

module.exports = rateLimitMiddleware;
