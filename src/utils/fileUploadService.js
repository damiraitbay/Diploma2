import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || 'src/public/uploads';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename using crypto
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// File filter with MIME type validation
const fileFilter = (req, file, cb) => {
    // Accept images only
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed!'), false);
    }
    cb(null, true);
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
        files: 1 // Only one file at a time
    }
});

// Delete file
const deleteFile = (filename) => {
    if (!filename) return;

    const filepath = path.join(process.env.UPLOAD_DIR || 'src/public/uploads', filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
};

// Get file URL
const getFileUrl = (filename) => {
    if (!filename) return null;
    return `/uploads/${filename}`;
};

// Clean old files (older than 24 hours)
const cleanOldFiles = () => {
    const uploadDir = process.env.UPLOAD_DIR || 'src/public/uploads';
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();

    files.forEach(file => {
        const filepath = path.join(uploadDir, file);
        const stats = fs.statSync(filepath);
        const fileAge = now - stats.mtime.getTime();

        // Delete files older than 24 hours
        if (fileAge > 24 * 60 * 60 * 1000) {
            fs.unlinkSync(filepath);
        }
    });
};

// Run cleanup every hour
setInterval(cleanOldFiles, 60 * 60 * 1000);

export {
    upload,
    deleteFile,
    getFileUrl,
    cleanOldFiles
};