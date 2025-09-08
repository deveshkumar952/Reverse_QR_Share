const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Session = require('../models/Session');
const config = require('../config/config');
const fs = require('fs-extra');
const path = require('path');

const createSession = async (req, res) => {
    try {
        const sessionId = uuidv4();
        const expiryMinutes = parseInt(req.body.expiryMinutes) || config.DEFAULT_SESSION_EXPIRY_MINUTES;

        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + Math.min(expiryMinutes, config.MAX_SESSION_EXPIRY_MINUTES));

        // Create session record
        const session = new Session({
            sessionId,
            expiresAt,
            receiverIP: req.ip,
            status: 'waiting'
        });

        await session.save();

        // Generate QR code with upload URL
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const uploadUrl = `${clientUrl}/send/${sessionId}`;

        const qrCodeDataUrl = await QRCode.toDataURL(uploadUrl, {
            width: config.QR_CODE_SIZE,
            errorCorrectionLevel: config.QR_CODE_ERROR_LEVEL
        });

        console.log('✅ Session created:', sessionId);

        res.json({
            success: true,
            sessionId,
            uploadUrl,
            qrCode: qrCodeDataUrl,
            expiresAt,
            status: session.status
        });

    } catch (error) {
        console.error('❌ Create session error:', error);
        res.status(500).json({ 
            error: 'Failed to create session', 
            message: error.message 
        });
    }
};

const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        console.log('📋 Getting session info:', sessionId);

        const session = await Session.findOne({ 
            sessionId,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            console.log('❌ Session not found:', sessionId);
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        const sessionInfo = {
            sessionId: session.sessionId,
            status: session.status,
            files: session.files.map(file => ({
                originalName: file.originalName,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: file.uploadedAt
            })),
            totalFiles: session.totalFiles,
            totalSize: session.totalSize,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt
        };

        console.log('✅ Session info retrieved:', {
            sessionId,
            status: session.status,
            fileCount: session.files.length
        });

        res.json(sessionInfo);

    } catch (error) {
        console.error('❌ Get session error:', error);
        res.status(500).json({ error: 'Failed to get session information' });
    }
};

const downloadFiles = async (req, res) => {
    try {
        const { sessionId } = req.params;

        console.log('📥 Getting download files for session:', sessionId);

        const session = await Session.findOne({ 
            sessionId,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            console.log('❌ Session not found for download:', sessionId);
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        if (session.files.length === 0) {
            console.log('📝 No files in session:', sessionId);
            return res.status(404).json({ error: 'No files available in this session' });
        }

        // Verify files exist on disk and prepare download info
        const downloadableFiles = [];

        for (const file of session.files) {
            const fileExists = await fs.pathExists(file.path);

            if (fileExists) {
                downloadableFiles.push({
                    originalName: file.originalName,
                    downloadUrl: `/api/session/${sessionId}/file/${file.filename}`, // Use stored filename
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: file.uploadedAt
                });

                console.log('✅ File available for download:', {
                    original: file.originalName,
                    stored: file.filename,
                    exists: true
                });
            } else {
                console.log('❌ File missing on disk:', {
                    original: file.originalName,
                    stored: file.filename,
                    path: file.path
                });
            }
        }

        console.log(`📦 Prepared ${downloadableFiles.length}/${session.files.length} files for download`);

        res.json({
            sessionId,
            files: downloadableFiles,
            totalFiles: downloadableFiles.length,
            totalSize: downloadableFiles.reduce((sum, f) => sum + f.size, 0)
        });

    } catch (error) {
        console.error('❌ Download files error:', error);
        res.status(500).json({ error: 'Failed to prepare downloads' });
    }
};

const downloadSingleFile = async (req, res) => {
    try {
        const { sessionId, filename } = req.params;

        console.log('⬇️ Download single file request:', { 
            sessionId, 
            filename,
            decodedFilename: decodeURIComponent(filename)
        });

        const session = await Session.findOne({ 
            sessionId,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            console.log('❌ Session not found for file download:', sessionId);
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        // Find file by the stored filename (with UUID prefix)
        const decodedFilename = decodeURIComponent(filename);
        const file = session.files.find(f => f.filename === decodedFilename);

        if (!file) {
            console.log('❌ File not found in session:', {
                requested: decodedFilename,
                available: session.files.map(f => f.filename)
            });
            return res.status(404).json({ error: 'File not found in session' });
        }

        console.log('📄 File found in session:', {
            originalName: file.originalName,
            storedName: file.filename,
            path: file.path,
            size: file.size
        });

        // Check if file exists on disk
        if (!await fs.pathExists(file.path)) {
            console.log('❌ File does not exist on disk:', file.path);
            return res.status(404).json({ error: 'File no longer available on server' });
        }

        console.log('✅ File exists on disk, starting download...');

        // Get file stats for verification
        const stats = await fs.stat(file.path);
        console.log('📊 File stats:', {
            size: stats.size,
            expectedSize: file.size,
            modified: stats.mtime
        });

        // Set headers for file download using original name
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'no-cache');

        console.log('📤 Starting file stream:', file.originalName);

        // Create and pipe file stream
        const fileStream = fs.createReadStream(file.path);

        fileStream.on('error', (error) => {
            console.error('❌ File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error reading file' });
            }
        });

        fileStream.on('open', () => {
            console.log('🟢 File stream opened successfully');
        });

        fileStream.on('end', () => {
            console.log('✅ File download completed:', file.originalName);
        });

        fileStream.pipe(res);

    } catch (error) {
        console.error('❌ Download single file error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    }
};

module.exports = {
    createSession,
    getSession,
    downloadFiles,
    downloadSingleFile
};
