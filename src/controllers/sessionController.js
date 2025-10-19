const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const QRCodeService = require('../services/QRCodeService');
const logger = require('../utils/logger');
const config = require('../config');

class SessionController {
  async createSession(req, res, next) {
    try {
      const { expiryMinutes = config.EXPIRY_MINUTES } = req.body;

      // Validate expiry minutes
      if (expiryMinutes > config.MAX_EXPIRY_MINUTES) {
        return res.status(400).json({
          error: `Expiry minutes cannot exceed ${config.MAX_EXPIRY_MINUTES}`
        });
      }

      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Create session in database
      const session = new Session({
        sessionId,
        expiresAt
      });

      await session.save();

      // Generate QR code
      const uploadUrl = `${config.CLIENT_URL}/send/${sessionId}`;
      const qrDataUrl = await QRCodeService.generateQRCode(uploadUrl);

      logger.info('Session created', { 
        sessionId, 
        expiresAt,
        uploadUrl 
      });

      res.status(201).json({
        sessionId,
        qrDataUrl,
        uploadUrl,
        expiresAt
      });

    } catch (error) {
      logger.error('Error creating session:', error);
      next(error);
    }
  }

  async getSession(req, res, next) {
    try {
      const { sessionId } = req.params;

      const session = await Session.findBySessionId(sessionId);

      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }

      if (session.isExpired()) {
        return res.status(410).json({
          error: 'Session has expired'
        });
      }

      res.json({
        sessionId: session.sessionId,
        status: session.status,
        files: session.files,
        totalSizeBytes: session.totalSizeBytes,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      });

    } catch (error) {
      logger.error('Error getting session:', error);
      next(error);
    }
  }

  async deleteSession(req, res, next) {
    try {
      const { sessionId } = req.params;

      const session = await Session.findBySessionId(sessionId);

      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }

      // TODO: Cleanup Cloudinary files
      await Session.deleteOne({ sessionId });

      logger.info('Session deleted', { sessionId });

      res.json({
        message: 'Session deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting session:', error);
      next(error);
    }
  }
}

module.exports = new SessionController();
