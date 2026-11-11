import mongoose from 'mongoose';
import { REPORT_REASONS, REPORT_STATUSES } from '../config/constants.js';

const reportSchema = new mongoose.Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'open',
      index: true
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);

