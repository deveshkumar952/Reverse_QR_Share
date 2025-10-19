const crypto = require('crypto');

class Helpers {
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static isValidMimeType(mimeType, allowedTypes = []) {
    if (allowedTypes.length === 0) {
      // Default allowed types
      allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'video/mp4',
        'audio/mpeg'
      ];
    }

    return allowedTypes.includes(mimeType);
  }

  static sanitizeFilename(filename) {
    // Remove or replace dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  static calculateChecksum(buffer) {
    return crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static parseUserAgent(userAgent) {
    const parser = {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Desktop'
    };

    if (!userAgent) return parser;

    // Simple user agent parsing
    if (userAgent.includes('Chrome')) parser.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) parser.browser = 'Firefox';
    else if (userAgent.includes('Safari')) parser.browser = 'Safari';
    else if (userAgent.includes('Edge')) parser.browser = 'Edge';

    if (userAgent.includes('Windows')) parser.os = 'Windows';
    else if (userAgent.includes('Mac')) parser.os = 'macOS';
    else if (userAgent.includes('Linux')) parser.os = 'Linux';
    else if (userAgent.includes('Android')) parser.os = 'Android';
    else if (userAgent.includes('iOS')) parser.os = 'iOS';

    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      parser.device = 'Mobile';
    } else if (userAgent.includes('Tablet')) {
      parser.device = 'Tablet';
    }

    return parser;
  }
}

module.exports = Helpers;
