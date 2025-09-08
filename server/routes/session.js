const express = require('express');
const { 
    createSession, 
    getSession, 
    downloadFiles,
    downloadSingleFile
} = require('../controllers/sessionController');

const router = express.Router();

// POST /api/session/create - Create a new receive session
router.post('/create', createSession);

// GET /api/session/:sessionId - Get session information
router.get('/:sessionId', getSession);

// GET /api/session/:sessionId/download - Get download information for all files
router.get('/:sessionId/download', downloadFiles);

// GET /api/session/:sessionId/file/:filename - Download a specific file
router.get('/:sessionId/file/:filename', downloadSingleFile);

module.exports = router;
