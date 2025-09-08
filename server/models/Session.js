const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    status: {
        type: String,
        enum: ['waiting', 'receiving', 'completed', 'expired'],
        default: 'waiting'
    },
    files: [{
        originalName: String,
        filename: String,
        mimetype: String,
        size: Number,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    receiverIP: String,
    senderIP: String,
    totalFiles: {
        type: Number,
        default: 0
    },
    totalSize: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// TTL index for automatic cleanup
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if session is expired
sessionSchema.virtual('isExpired').get(function() {
    return new Date() > this.expiresAt;
});

module.exports = mongoose.model('Session', sessionSchema);
