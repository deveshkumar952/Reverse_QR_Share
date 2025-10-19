require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'reverse-qr',

  // Session settings
  EXPIRY_MINUTES: parseInt(process.env.EXPIRY_MINUTES, 10) || 60,
  MAX_EXPIRY_MINUTES: parseInt(process.env.MAX_EXPIRY_MINUTES, 10) || 1440,
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 100,
  MAX_TOTAL_STORAGE_MB: parseInt(process.env.MAX_TOTAL_STORAGE_MB, 10) || 1000,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
};
