const multer = require('multer');

/**
 * Multer upload middleware using memory storage.
 * Files are not written to disk — they stay as Buffer objects (req.file.buffer)
 * and are streamed directly to Cloudinary.
 *
 * Max file size: 50 MB (configurable via MAX_UPLOAD_MB env var)
 */

const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_MB) || 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    // Documents / PDFs
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed. Accepted: images, videos, PDFs, Word documents.`), false);
    }
};

const multerConfig = multer({
    storage,
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter,
});

/**
 * Single file upload middleware.
 * @param {string} field - form field name
 */
const uploadSingle = (field) => multerConfig.single(field);

/**
 * Multiple files upload middleware.
 * @param {string} field - form field name
 * @param {number} max - maximum number of files
 */
const uploadMultiple = (field, max = 10) => multerConfig.array(field, max);

module.exports = { uploadSingle, uploadMultiple };
