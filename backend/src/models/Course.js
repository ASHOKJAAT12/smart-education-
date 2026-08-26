const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters'],
            maxlength: [120, 'Title must be at most 120 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description must be at most 1000 characters'],
        },
        thumbnail: {
            type: String,
            default: null,
        },
        publicId: {
            type: String,   // Cloudinary public_id for deletion
            default: null,
            select: false,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────
courseSchema.index({ isPublished: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ createdBy: 1 });

// ─── Virtual: subjects ────────────────────────────────────────────────────
courseSchema.virtual('subjects', {
    ref: 'Subject',
    localField: '_id',
    foreignField: 'courseId',
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
