const Session = require('../models/Session');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');

const cleanupExpiredSessions = async () => {
    try {
        console.log('Starting cleanup of expired sessions...');

        const expiredSessions = await Session.find({
            $or: [
                { expiresAt: { $lt: new Date() } },
                { status: 'expired' }
            ]
        });

        let cleanedCount = 0;

        for (const session of expiredSessions) {
            try {
                // Delete files from disk
                const sessionPath = path.join(config.UPLOAD_PATH, session.sessionId);
                if (await fs.pathExists(sessionPath)) {
                    await fs.remove(sessionPath);
                }

                // Delete session record
                await Session.deleteOne({ _id: session._id });
                cleanedCount++;

            } catch (error) {
                console.error(`Error cleaning up session ${session.sessionId}:`, error);
            }
        }

        if (cleanedCount > 0) {
            console.log(`Cleaned up ${cleanedCount} expired sessions`);
        }

        return cleanedCount;

    } catch (error) {
        console.error('Cleanup process error:', error);
        throw error;
    }
};

const getStats = async () => {
    try {
        const totalSessions = await Session.countDocuments();
        const activeSessions = await Session.countDocuments({ 
            expiresAt: { $gt: new Date() },
            status: { $ne: 'expired' }
        });
        const expiredSessions = await Session.countDocuments({
            $or: [
                { expiresAt: { $lt: new Date() } },
                { status: 'expired' }
            ]
        });

        const sessionsByStatus = await Session.aggregate([
            { $match: { expiresAt: { $gt: new Date() } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        return {
            totalSessions,
            activeSessions,
            expiredSessions,
            sessionsByStatus: sessionsByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        throw error;
    }
};

module.exports = {
    cleanupExpiredSessions,
    getStats
};
