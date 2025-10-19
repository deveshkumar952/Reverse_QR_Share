const QRCode = require('qrcode');
const logger = require('../utils/logger');

class QRCodeService {
  static async generateQRCode(data, options = {}) {
    try {
      const qrOptions = {
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        ...options
      };

      const qrDataUrl = await QRCode.toDataURL(data, qrOptions);

      logger.debug('QR code generated', { 
        dataLength: data.length,
        size: qrOptions.width 
      });

      return qrDataUrl;
    } catch (error) {
      logger.error('QR code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static async generateQRCodeBuffer(data, options = {}) {
    try {
      const qrOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        ...options
      };

      return await QRCode.toBuffer(data, qrOptions);
    } catch (error) {
      logger.error('QR code buffer generation failed:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }
}

module.exports = QRCodeService;
