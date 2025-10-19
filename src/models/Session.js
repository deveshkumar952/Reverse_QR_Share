const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  secureUrl: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  sizeBytes: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  etag: {
    type: String
  },
  version: {
    type: Number
  },
  resourceType: {
    type: String,
    enum: ['image', 'video', 'raw'],
    default: 'raw'
  }
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['waiting', 'uploading', 'completed', 'expired'],
    default: 'waiting'
  },
  files: [FileSchema],
  totalSizeBytes: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Instance methods
SessionSchema.methods.addFile = function(fileData) {
  this.files.push(fileData);
  this.totalSizeBytes += fileData.sizeBytes;
  return this.save();
};

SessionSchema.methods.updateStatus = function(status) {
  this.status = status;
  return this.save();
};

SessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Static methods
SessionSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ sessionId });
};

SessionSchema.statics.findActiveSession = function(sessionId) {
  return this.findOne({ 
    sessionId, 
    expiresAt: { $gt: new Date() } 
  });
};

module.exports = mongoose.model('Session', SessionSchema);