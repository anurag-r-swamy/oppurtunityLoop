import mongoose from 'mongoose';
import { PARTICIPATION_STATUSES } from '../config/constants.js';

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  },
  { _id: true }
);

const participationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true
    },
    status: {
      type: String,
      enum: PARTICIPATION_STATUSES,
      default: 'interested',
      index: true
    },
    preparationChecklist: {
      type: [checklistItemSchema],
      default: []
    },
    registrationUrl: {
      type: String,
      trim: true,
      maxlength: 400,
      default: ''
    },
    registeredAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    participatedAt: { type: Date, default: null },
    outcome: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    evidenceUrl: {
      type: String,
      trim: true,
      maxlength: 400,
      default: ''
    },
    verificationOrigin: {
      type: String,
      enum: ['self_reported', 'organizer_confirmed'],
      default: 'self_reported'
    },
    personalNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    }
  },
  { timestamps: true }
);

participationSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });
participationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
participationSchema.index({ opportunityId: 1, status: 1 });

export const Participation = mongoose.model('Participation', participationSchema);

