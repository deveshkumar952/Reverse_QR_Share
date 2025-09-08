const express = require('express');
const Session = require('../models/Session');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();

// Debug endpoint to check session and file status
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findOne({ sessionId });

        if (!session) {
            return res.json({
                error: 'Session not found',
                sessionId
            });
        }

        // Check file status
        const fileStatus = [];
        for (const file of session.files) {
            const exists = await fs.pathExists(file.path);
            let stats = null;

            if (exists) {
                try {
                    stats = await fs.stat(file.path);
                } catch (error) {
                    console.error('Error getting file stats:', error);
                }
            }

            fileStatus.push({
                originalName: file.originalName,
                storedFilename: file.filename,
                path: file.path,
                expectedSize: file.size,
                actualSize: stats ? stats.size : null,
                exists: exists,
                mimetype: file.mimetype,
                uploadedAt: file.uploadedAt
            });
        }

        res.json({
            sessionId: session.sessionId,
            status: session.status,
            expiresAt: session.expiresAt,
            isExpired: new Date() > session.expiresAt,
            totalFiles: session.totalFiles,
            totalSize: session.totalSize,
            createdAt: session.createdAt,
            files: fileStatus,
            uploadPath: path.join(__dirname, '../uploads', sessionId)
        });

    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            error: 'Debug check failed',
            message: error.message
        });
    }
});

module.exports = router;
