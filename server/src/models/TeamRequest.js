import mongoose from 'mongoose';
import { EXPERIENCE_LEVELS } from '../config/constants.js';

const teamMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roleInTeam: {
      type: String,
      enum: ['leader', 'member'],
      default: 'member'
    },
    skillsOffered: { type: [String], default: [] },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const teamInvitationOrRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    direction: {
      type: String,
      enum: ['join_request', 'leader_invite'],
      required: true
    },
    message: { type: String, trim: true, maxlength: 400, default: '' },
    skillsOffered: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    respondedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const teamRequestSchema = new mongoose.Schema(
  {
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 140
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    requiredSkills: { type: [String], default: [] },
    creatorSkills: { type: [String], default: [] },
    desiredExperienceLevel: {
      type: String,
      enum: [...EXPERIENCE_LEVELS, 'any'],
      default: 'any'
    },
    maximumMembers: {
      type: Number,
      required: true,
      min: 2,
      max: 15,
      default: 4
    },
    members: {
      type: [teamMemberSchema],
      default: []
    },
    requests: {
      type: [teamInvitationOrRequestSchema],
      default: []
    },
    requestStatus: {
      type: String,
      enum: ['open', 'full', 'closed'],
      default: 'open',
      index: true
    }
  },
  { timestamps: true }
);

teamRequestSchema.index({ opportunityId: 1, requestStatus: 1, createdAt: -1 });
teamRequestSchema.index({ 'members.userId': 1 });

export const TeamRequest = mongoose.model('TeamRequest', teamRequestSchema);

