const Session = require('../models/Session');
const CloudinaryStorageAdapter = require('../services/CloudinaryStorageAdapter');
const SSEService = require('../services/SSEService');
const logger = require('../utils/logger');
const config = require('../config');

class UploadController {
  constructor() {
    this.storageAdapter = new CloudinaryStorageAdapter();
    this.uploads = new Map(); // Store upload state

    // Bind methods to preserve 'this' context
    this.initializeUpload = this.initializeUpload.bind(this);
    this.uploadPart = this.uploadPart.bind(this);
    this.completeUpload = this.completeUpload.bind(this);
    this.getDownloadUrl = this.getDownloadUrl.bind(this);
  }

  async initializeUpload(req, res, next) {
    try {
      const { sessionId, fileName, size, mimeType } = req.body;

      // Validate session
      const session = await Session.findActiveSession(sessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found or expired'
        });
      }

      // Validate file size
      const maxSizeBytes = config.MAX_FILE_SIZE_MB * 1024 * 1024;
      if (size > maxSizeBytes) {
        return res.status(400).json({
          error: `File size exceeds ${config.MAX_FILE_SIZE_MB}MB limit`
        });
      }

      // Check total storage limit
      const newTotalSize = session.totalSizeBytes + size;
      const maxTotalBytes = config.MAX_TOTAL_STORAGE_MB * 1024 * 1024;
      if (newTotalSize > maxTotalBytes) {
        return res.status(400).json({
          error: `Total storage would exceed ${config.MAX_TOTAL_STORAGE_MB}MB limit`
        });
      }

      const uploadId = require('uuid').v4();
      const recommendedPartSize = Math.min(5 * 1024 * 1024, Math.ceil(size / 10)); // 5MB or size/10

      // Store upload metadata
      this.uploads.set(uploadId, {
        sessionId,
        fileName,
        size,
        mimeType,
        chunks: [],
        bytesReceived: 0,
        startTime: Date.now()
      });

      // Update session status
      await session.updateStatus('uploading');

      // Notify via SSE
      SSEService.broadcast(sessionId, {
        type: 'uploadStarted',
        fileName,
        size
      });

      logger.info('Upload initialized', { 
        uploadId, 
        sessionId, 
        fileName, 
        size 
      });

      res.json({
        uploadId,
        recommendedPartSize,
        maxChunkSize: 10 * 1024 * 1024 // 10MB max chunk
      });

    } catch (error) {
      logger.error('Error initializing upload:', error);
      next(error);
    }
  }

  async uploadPart(req, res, next) {
    try {
      const uploadId = req.headers['x-upload-id'];
      const chunkIndex = parseInt(req.headers['x-chunk-index']) || 0;

      if (!uploadId) {
        return res.status(400).json({
          error: 'Upload ID required in X-Upload-Id header'
        });
      }

      const uploadMeta = this.uploads.get(uploadId);
      if (!uploadMeta) {
        return res.status(404).json({
          error: 'Upload session not found'
        });
      }

      // Store chunk data
      const chunkData = req.body;
      uploadMeta.chunks[chunkIndex] = chunkData;
      uploadMeta.bytesReceived += chunkData.length;

      // Calculate progress
      const progress = (uploadMeta.bytesReceived / uploadMeta.size) * 100;

      // Notify progress via SSE
      SSEService.broadcast(uploadMeta.sessionId, {
        type: 'uploadProgress',
        progress: Math.round(progress),
        bytesReceived: uploadMeta.bytesReceived,
        totalBytes: uploadMeta.size
      });

      logger.debug('Chunk uploaded', { 
        uploadId, 
        chunkIndex, 
        chunkSize: chunkData.length,
        progress: Math.round(progress)
      });

      res.json({
        chunkIndex,
        bytesReceived: uploadMeta.bytesReceived,
        progress: Math.round(progress)
      });

    } catch (error) {
      logger.error('Error uploading part:', error);
      next(error);
    }
  }

  async completeUpload(req, res, next) {
    try {
      const { sessionId, uploadId } = req.body;

      const uploadMeta = this.uploads.get(uploadId);
      if (!uploadMeta) {
        return res.status(404).json({
          error: 'Upload session not found'
        });
      }

      const session = await Session.findActiveSession(sessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found or expired'
        });
      }

      try {
        // Combine all chunks
        const fileBuffer = Buffer.concat(uploadMeta.chunks);

        // Upload to Cloudinary
        const uploadResult = await this.storageAdapter.uploadChunked(fileBuffer, {
          sessionId: uploadMeta.sessionId,
          fileName: uploadMeta.fileName,
          mimeType: uploadMeta.mimeType
        });

        // Determine resource type
        const resourceType = this.storageAdapter.getResourceType(uploadResult.public_id);

        // Add file to session - JUST USE THE SECURE_URL FROM CLOUDINARY
        const fileData = {
          originalName: uploadMeta.fileName,
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url, // This is the working URL!
          mimeType: uploadMeta.mimeType,
          sizeBytes: uploadResult.bytes,
          etag: uploadResult.etag,
          version: uploadResult.version,
          resourceType: resourceType
        };

        await session.addFile(fileData);
        await session.updateStatus('completed');

        // Cleanup upload metadata
        this.uploads.delete(uploadId);

        // Notify completion via SSE
        SSEService.broadcast(sessionId, {
          type: 'uploadComplete',
          file: fileData
        });

        logger.info('Upload completed', { 
          uploadId, 
          sessionId, 
          fileName: uploadMeta.fileName,
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url
        });

        res.json({
          message: 'Upload completed successfully',
          fileMetadata: fileData
        });

      } catch (uploadError) {
        logger.error('Cloudinary upload failed:', uploadError);

        // Notify error via SSE
        SSEService.broadcast(sessionId, {
          type: 'uploadError',
          error: 'File upload failed'
        });

        // Cleanup
        this.uploads.delete(uploadId);

        return res.status(500).json({
          error: 'File upload to cloud storage failed'
        });
      }

    } catch (error) {
      logger.error('Error completing upload:', error);
      next(error);
    }
  }

  async getDownloadUrl(req, res, next) {
    try {
      const { sessionId, publicId } = req.params;

      // Decode the publicId (it comes URL encoded from the client)
      const decodedPublicId = decodeURIComponent(publicId);

      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }

      // Find file in session using decoded publicId
      const file = session.files.find(f => f.publicId === decodedPublicId);
      if (!file) {
        logger.warn('File not found', {
          sessionId,
          requestedPublicId: decodedPublicId,
          availableFiles: session.files.map(f => f.publicId)
        });

        return res.status(404).json({
          error: 'File not found',
          requestedPublicId: decodedPublicId
        });
      }

      // SIMPLE: Just return the secure_url that Cloudinary gave us!
      // It already works and doesn't expire for public uploads
      const downloadUrl = file.secureUrl;

      logger.info('Download URL provided', { 
        sessionId, 
        publicId: decodedPublicId, 
        fileName: file.originalName,
        url: downloadUrl
      });

      res.json({
        signedUrl: downloadUrl, // Use the secure_url directly
        fileName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        expiresAt: null // No expiration for public URLs
      });

    } catch (error) {
      logger.error('Error generating download URL:', error);
      next(error);
    }
  }
}

module.exports = new UploadController();