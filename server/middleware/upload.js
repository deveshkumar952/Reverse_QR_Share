const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config/config');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
fs.ensureDirSync(config.UPLOAD_PATH);

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const sessionPath = path.join(config.UPLOAD_PATH, req.sessionId);
        fs.ensureDirSync(sessionPath);
        cb(null, sessionPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: config.MAX_FILES
    },
    fileFilter: fileFilter
});

module.exports = upload;
