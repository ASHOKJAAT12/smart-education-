const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        actorRole: {
            type: String,
            required: true
        },
        action: {
            type: String,
            required: true
        },
        entityType: {
            type: String // e.g., 'User', 'Course', 'System'
        },
        entityId: {
            type: mongoose.Schema.Types.Mixed // Mixed because some entities might have string IDs or sub-schemas
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        ipAddress: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Advanced Indexing for fast search via the Admin Audit Dashboard
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
