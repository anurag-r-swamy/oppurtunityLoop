import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { versionKey: false }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

