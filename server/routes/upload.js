const express = require('express');
const upload = require('../middleware/upload');
const { uploadToSession, completeSession } = require('../controllers/uploadController');

const router = express.Router();

// Middleware to add sessionId from params
const addSessionIdToRequest = (req, res, next) => {
    req.sessionId = req.params.sessionId;
    next();
};

// POST /api/upload/:sessionId - Upload files to a session
router.post('/:sessionId', 
    addSessionIdToRequest,
    upload.array('files', 20), // Allow up to 20 files
    uploadToSession
);

// POST /api/upload/:sessionId/complete - Mark session as completed
router.post('/:sessionId/complete', completeSession);

module.exports = router;
