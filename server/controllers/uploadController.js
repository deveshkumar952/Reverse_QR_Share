const Session = require('../models/Session');
const config = require('../config/config');
const fs = require('fs-extra');

const uploadToSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Find the session
        const session = await Session.findOne({ 
            sessionId,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            // Cleanup uploaded files if session not found
            req.files.forEach(file => {
                fs.remove(file.path).catch(console.error);
            });
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        if (session.status === 'completed') {
            return res.status(400).json({ error: 'Session already completed' });
        }

        // Process uploaded files
        const newFiles = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            uploadedAt: new Date()
        }));

        // Check total session size
        const newTotalSize = session.totalSize + newFiles.reduce((sum, file) => sum + file.size, 0);
        if (newTotalSize > config.MAX_SESSION_SIZE) {
            // Cleanup files and reject
            req.files.forEach(file => {
                fs.remove(file.path).catch(console.error);
            });
            return res.status(413).json({ 
                error: 'Total session size would exceed limit',
                limit: config.MAX_SESSION_SIZE,
                current: session.totalSize,
                attempted: newTotalSize
            });
        }

        // Update session
        session.files.push(...newFiles);
        session.totalFiles = session.files.length;
        session.totalSize = newTotalSize;
        session.status = session.files.length > 0 ? 'receiving' : 'waiting';
        session.senderIP = req.ip;

        await session.save();

        console.log(`Files uploaded to session ${sessionId}:`, newFiles.map(f => f.originalName));

        // Notify receiver via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(sessionId).emit('files-uploaded', {
                sessionId,
                newFiles: newFiles.map(file => ({
                    originalName: file.originalName,
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: file.uploadedAt
                })),
                totalFiles: session.totalFiles,
                totalSize: session.totalSize,
                status: session.status
            });
        }

        res.json({
            success: true,
            sessionId,
            uploadedFiles: newFiles.length,
            totalFiles: session.totalFiles,
            totalSize: session.totalSize,
            status: session.status
        });

    } catch (error) {
        console.error('Upload to session error:', error);

        // Cleanup files on error
        if (req.files) {
            req.files.forEach(file => {
                fs.remove(file.path).catch(console.error);
            });
        }

        res.status(500).json({ 
            error: 'Upload failed', 
            message: error.message 
        });
    }
};

const completeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findOne({ 
            sessionId,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        session.status = 'completed';
        await session.save();

        // Notify receiver that upload is complete
        const io = req.app.get('io');
        if (io) {
            io.to(sessionId).emit('session-completed', {
                sessionId,
                totalFiles: session.totalFiles,
                totalSize: session.totalSize
            });
        }

        console.log(`Session completed: ${sessionId}`);

        res.json({
            success: true,
            sessionId,
            status: session.status,
            totalFiles: session.totalFiles,
            totalSize: session.totalSize
        });

    } catch (error) {
        console.error('Complete session error:', error);
        res.status(500).json({ error: 'Failed to complete session' });
    }
};

module.exports = {
    uploadToSession,
    completeSession
};
