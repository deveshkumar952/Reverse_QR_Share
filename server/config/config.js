module.exports = {
    // File upload settings
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB per file
    MAX_FILES: 20,
    MAX_SESSION_SIZE: 500 * 1024 * 1024, // 500MB total per session
    ALLOWED_FILE_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo'
    ],

    // Session settings
    DEFAULT_SESSION_EXPIRY_MINUTES: 30,
    MAX_SESSION_EXPIRY_MINUTES: 120, // 2 hours

    // QR Code settings
    QR_CODE_SIZE: 256,
    QR_CODE_ERROR_LEVEL: 'M',

    // Paths
    UPLOAD_PATH: './uploads',
    TEMP_PATH: './temp',

    // Socket.IO settings
    SOCKET_TIMEOUT: 30000, // 30 seconds

    // Auto-download settings
    AUTO_DOWNLOAD_DELAY: 2000, // 2 seconds delay before auto-download
};
