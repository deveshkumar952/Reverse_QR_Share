const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Create TTL index for sessions
    await createIndexes();

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const Session = require('../models/Session');

    // TTL index for automatic cleanup
    await Session.collection.createIndex(
      { expiresAt: 1 }, 
      { expireAfterSeconds: 0 }
    );

    // Unique index on sessionId
    await Session.collection.createIndex(
      { sessionId: 1 }, 
      { unique: true }
    );

    // Compound index for file lookups
    await Session.collection.createIndex({
      sessionId: 1,
      'files.publicId': 1
    });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

module.exports = connectDB;
