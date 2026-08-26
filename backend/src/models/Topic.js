const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Topic name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name must be at most 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description must be at most 1000 characters'],
            default: '',
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: [true, 'Subject ID is required'],
        },
        order: {
            type: Number,
            default: 0,
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
        estimatedMinutes: {
            type: Number,
            min: [1, 'Estimated minutes must be at least 1'],
            max: [300, 'Estimated minutes must be at most 300'],
            default: 30,
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
    { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────
topicSchema.index({ subjectId: 1, order: 1 });
topicSchema.index({ difficulty: 1 });
topicSchema.index({ isPublished: 1 });
topicSchema.index({ createdBy: 1 });

const Topic = mongoose.model('Topic', topicSchema);
module.exports = Topic;
