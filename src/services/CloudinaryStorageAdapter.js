const cloudinary = require('../config/cloudinary');
const config = require('../config');
const logger = require('../utils/logger');

class CloudinaryStorageAdapter {
  constructor() {
    this.cloudinary = cloudinary;
    this.folder = config.CLOUDINARY_FOLDER;
  }

  async uploadChunked(fileBuffer, options = {}) {
    const { sessionId, fileName, mimeType } = options;

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: `${this.folder}/${sessionId}`,
        public_id: this.generatePublicId(fileName),
        resource_type: 'auto',
        type: 'upload',
        overwrite: false,
        unique_filename: true
      };

      // Use upload_stream for buffer data
      const uploadStream = this.cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload failed:', error);
            reject(error);
          } else {
            logger.info('File uploaded to Cloudinary', {
              publicId: result.public_id,
              bytes: result.bytes,
              format: result.format,
              resourceType: result.resource_type,
              version: result.version
            });
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      uploadStream.end(fileBuffer);
    });
  }

  generateSignedUrl(publicId, expiresIn = 3600, version = null, resourceType = null) {
    try {
      // If resourceType not provided, detect it
      if (!resourceType) {
        resourceType = this.getResourceType(publicId);
      }

      const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

      // Build URL options
      const urlOptions = {
        resource_type: resourceType,
        type: 'upload',
        sign_url: true,
        secure: true,
        expires_at: timestamp
      };

      // Add version if provided
      if (version) {
        urlOptions.version = version;
      }

      // Generate signed URL
      const signedUrl = this.cloudinary.url(publicId, urlOptions);

      logger.debug('Generated signed URL', {
        publicId,
        resourceType,
        version,
        expiresAt: new Date(timestamp * 1000).toISOString()
      });

      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  getResourceType(publicId) {
    // Extract file extension from publicId
    const extension = publicId.split('.').pop().toLowerCase();

    // Image extensions
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'];
    // Video extensions
    const videoExts = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'm4v'];
    // Audio extensions  
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];

    if (imageExts.includes(extension)) {
      return 'image';
    } else if (videoExts.includes(extension)) {
      return 'video';
    } else if (audioExts.includes(extension)) {
      return 'video'; // Cloudinary uses 'video' for audio files
    } else {
      return 'raw'; // For PDFs, documents, etc.
    }
  }

  async cleanup(sessionId) {
    try {
      const folderPath = `${this.folder}/${sessionId}`;

      // Delete all resources in the session folder for each resource type
      const resourceTypes = ['image', 'video', 'raw'];
      let totalDeleted = 0;

      for (const resourceType of resourceTypes) {
        try {
          const deleteResult = await this.cloudinary.api.delete_resources_by_prefix(
            folderPath,
            { resource_type: resourceType }
          );

          if (deleteResult.deleted) {
            totalDeleted += Object.keys(deleteResult.deleted).length;
          }
        } catch (err) {
          // Continue even if one resource type fails
          logger.warn(`Failed to delete ${resourceType} resources`, err);
        }
      }

      // Delete the folder itself
      try {
        await this.cloudinary.api.delete_folder(folderPath);
      } catch (err) {
        logger.warn('Failed to delete folder', err);
      }

      logger.info('Cloudinary cleanup completed', {
        sessionId,
        deletedCount: totalDeleted
      });

      return { success: true, deletedCount: totalDeleted };
    } catch (error) {
      logger.error('Cloudinary cleanup failed:', error);
      throw error;
    }
  }

  generatePublicId(fileName) {
    // Keep the original extension
    const parts = fileName.split('.');
    const extension = parts.length > 1 ? parts.pop() : '';
    const nameWithoutExt = parts.join('.');

    // Sanitize filename
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();

    // Return with extension if it exists
    return extension ? `${sanitized}_${timestamp}.${extension}` : `${sanitized}_${timestamp}`;
  }

  async getResourceInfo(publicId, resourceType = null) {
    try {
      if (!resourceType) {
        resourceType = this.getResourceType(publicId);
      }

      return await this.cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });
    } catch (error) {
      logger.error('Error getting resource info:', error);
      throw error;
    }
  }
}

module.exports = CloudinaryStorageAdapter;