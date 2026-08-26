const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { timestamps: true, _id: true }); // ID helps direct patching later if needed

const aiConversationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    topicId: { // Optional: Bind chat session contextually
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic'
    },
    title: {
        type: String,
        default: 'New Chat Session'
    },
    messages: [messageSchema],
    metadata: {
        totalTokens: { type: Number, default: 0 },
        messageCount: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Add TTL mapping naturally or an archiving cron job for large contexts in the future
aiConversationSchema.index({ studentId: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
