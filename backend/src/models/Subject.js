const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Subject name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name must be at most 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description must be at most 500 characters'],
            default: '',
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course ID is required'],
        },
        order: {
            type: Number,
            default: 0,
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
subjectSchema.index({ courseId: 1, order: 1 });
subjectSchema.index({ isPublished: 1 });
subjectSchema.index({ createdBy: 1 });
// Teacher-scoped listing resolves ownership through the parent course.
subjectSchema.index({ courseId: 1, isPublished: 1 });

// ─── Virtual: topics ──────────────────────────────────────────────────────
subjectSchema.virtual('topics', {
    ref: 'Topic',
    localField: '_id',
    foreignField: 'subjectId',
});

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;
