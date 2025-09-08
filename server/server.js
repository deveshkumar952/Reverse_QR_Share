require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');

// Import routes
const sessionRoutes = require('./routes/session');
const uploadRoutes = require('./routes/upload');
const debugRoutes = require('./routes/debug');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Trust proxy setting - IMPORTANT for rate limiting to work correctly
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Trust first proxy in production
} else {
    app.set('trust proxy', false); // Don't trust proxy in development
}

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting with proper configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    validate: {
        xForwardedForHeader: false, // Disable X-Forwarded-For validation
    },
    keyGenerator: (req) => {
        if (process.env.NODE_ENV !== 'production') {
            return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
        }
        return req.ip;
    }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/session', sessionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/debug', debugRoutes); // Debug routes for development

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        trustProxy: app.get('trust proxy'),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
        console.log(`👥 Socket ${socket.id} joined session: ${sessionId}`);
    });

    socket.on('leave-session', (sessionId) => {
        socket.leave(sessionId);
        console.log(`👋 Socket ${socket.id} left session: ${sessionId}`);
    });

    socket.on('disconnect', () => {
        console.log(`📴 Client disconnected: ${socket.id}`);
    });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reverse-qr-share', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('🔧 Trust proxy setting:', app.get('trust proxy'));

    // Start server
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔗 Socket.IO server ready`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🐛 Debug endpoint: http://localhost:${PORT}/api/debug/session/{sessionId}`);
    });
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Cleanup expired sessions every hour
const { cleanupExpiredSessions } = require('./controllers/cleanupController');
setInterval(cleanupExpiredSessions, 60 * 60 * 1000); // 1 hour

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('💥 Server error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
