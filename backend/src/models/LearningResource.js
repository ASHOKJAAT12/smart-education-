const mongoose = require('mongoose');

const RESOURCE_TYPES = ['pdf', 'image', 'video', 'link', 'document'];

const learningResourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Resource title is required'],
            trim: true,
            maxlength: [150, 'Title must be at most 150 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description must be at most 500 characters'],
            default: '',
        },
        type: {
            type: String,
            enum: RESOURCE_TYPES,
            required: [true, 'Resource type is required'],
        },
        url: {
            type: String,
            required: [true, 'Resource URL is required'],
        },
        publicId: {
            // Cloudinary public_id — set only for uploaded files (pdf, image, video, document)
            // null for external links
            type: String,
            default: null,
            select: false,
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course ID is required'],
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Topic',
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────
learningResourceSchema.index({ courseId: 1 });
learningResourceSchema.index({ subjectId: 1 });
learningResourceSchema.index({ topicId: 1 });
learningResourceSchema.index({ type: 1 });
learningResourceSchema.index({ isPublished: 1 });
learningResourceSchema.index({ uploadedBy: 1 });

const LearningResource = mongoose.model('LearningResource', learningResourceSchema);

module.exports = LearningResource;
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
