const express = require('express');
const sessionController = require('../controllers/sessionController');
const uploadController = require('../controllers/uploadController');
const healthController = require('../controllers/healthController');
const SSEService = require('../services/SSEService');
const { validate, validateUUID, schemas } = require('../middleware/validation');

const router = express.Router();

// Health check
router.get('/health', healthController.checkHealth);

// Session routes
router.post('/session', 
  validate(schemas.createSession),
  sessionController.createSession
);

router.get('/session/:sessionId', 
  validateUUID('sessionId'),
  sessionController.getSession
);

router.delete('/session/:sessionId',
  validateUUID('sessionId'), 
  sessionController.deleteSession
);

// Upload routes
router.post('/upload/init',
  validate(schemas.uploadInit),
  uploadController.initializeUpload
);

router.put('/upload/part',
  express.raw({ type: 'application/octet-stream', limit: '10mb' }),
  uploadController.uploadPart
);

router.post('/upload/complete',
  validate(schemas.uploadComplete),
  uploadController.completeUpload
);

// Download routes - publicId is URL encoded and may contain slashes
router.get('/session/:sessionId/file/:publicId(*)',
  validateUUID('sessionId'),
  uploadController.getDownloadUrl
);

// Server-Sent Events
router.get('/events', (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({
      error: 'sessionId query parameter required'
    });
  }

  SSEService.addClient(sessionId, res);
});

module.exports = router;