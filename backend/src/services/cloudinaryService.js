const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

/**
 * Cloudinary service — abstracts all Cloudinary SDK calls.
 * Controllers and route handlers never call Cloudinary directly.
 *
 * Requires env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

// Lazy config — only configure when first used
let configured = false;
const ensureConfigured = () => {
    if (configured) return;
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        const err = new Error('Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');
        err.statusCode = 503;
        throw err;
    }
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
};

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer — file buffer from multer memoryStorage
 * @param {object} options
 * @param {string} options.folder — Cloudinary folder (e.g. 'smartlearn/resources')
 * @param {string} [options.resource_type] — 'image' | 'video' | 'raw' (default: auto)
 * @param {string} [options.public_id] — optional fixed public_id
 * @returns {Promise<{ url: string, publicId: string, resourceType: string }>}
 */
const uploadFile = (buffer, options = {}) => {
    ensureConfigured();

    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: options.folder || 'smartlearn/resources',
            resource_type: options.resource_type || 'auto',
            ...(options.public_id && { public_id: options.public_id }),
        };

        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve({
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type,
            });
        });

        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

/**
 * Delete a file from Cloudinary by its public_id.
 *
 * @param {string} publicId
 * @param {string} [resourceType] — 'image' | 'video' | 'raw'
 */
const deleteFile = async (publicId, resourceType = 'image') => {
    ensureConfigured();
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Upload a thumbnail image (course thumbnails, etc.)
 * Enforces image-only and consistent folder.
 */
const uploadThumbnail = (buffer) => {
    return uploadFile(buffer, {
        folder: 'smartlearn/thumbnails',
        resource_type: 'image',
    });
};

/**
 * Upload a learning resource (pdf, video, image, document).
 */
const uploadResource = (buffer, type) => {
    const resourceTypeMap = {
        image: 'image',
        video: 'video',
        pdf: 'raw',
        document: 'raw',
    };
    return uploadFile(buffer, {
        folder: 'smartlearn/resources',
        resource_type: resourceTypeMap[type] || 'auto',
    });
};

module.exports = { uploadFile, deleteFile, uploadThumbnail, uploadResource };
