import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['deadline_reminder', 'team_update', 'listing_status', 'system'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600
    },
    relatedOpportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null
    },
    reminderWindowKey: {
      type: String,
      default: null
    },
    scheduledAt: { type: Date, default: Date.now },
    sentAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'sent'
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate reminders for the same user, opportunity, and reminder window
notificationSchema.index(
  { userId: 1, relatedOpportunityId: 1, reminderWindowKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reminderWindowKey: { $type: 'string' },
      relatedOpportunityId: { $type: 'objectId' }
    }
  }
);
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

