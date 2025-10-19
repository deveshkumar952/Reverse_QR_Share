const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Session = require('../models/Session');
const logger = require('../utils/logger');

class HealthController {
  async checkHealth(req, res) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };

    const checks = {};

    try {
      // MongoDB health check
      const mongoState = mongoose.connection.readyState;
      checks.mongodb = {
        status: mongoState === 1 ? 'connected' : 'disconnected',
        state: mongoState
      };

      // Cloudinary health check
      try {
        await cloudinary.api.ping();
        checks.cloudinary = {
          status: 'connected'
        };
      } catch (cloudinaryError) {
        checks.cloudinary = {
          status: 'error',
          error: cloudinaryError.message
        };
      }

      // Database metrics
      const activeSessions = await Session.countDocuments({
        expiresAt: { $gt: new Date() }
      });

      checks.database = {
        activeSessions,
        totalConnections: mongoose.connections.length
      };

      // Memory usage
      const memUsage = process.memoryUsage();
      checks.memory = {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
      };

      // Determine overall health
      const hasErrors = Object.values(checks).some(check => 
        check.status === 'error' || check.status === 'disconnected'
      );

      if (hasErrors) {
        health.status = 'degraded';
      }

      health.checks = checks;

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);

    } catch (error) {
      logger.error('Health check failed:', error);

      health.status = 'unhealthy';
      health.error = error.message;

      res.status(503).json(health);
    }
  }
}

module.exports = new HealthController();
