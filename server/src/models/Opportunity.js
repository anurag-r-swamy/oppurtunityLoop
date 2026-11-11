import mongoose from 'mongoose';
import {
  ACADEMIC_DISCIPLINES,
  DEGREE_LEVELS,
  EVENT_MODES,
  OPPORTUNITY_CATEGORIES,
  PUBLICATION_STATUSES,
  VERIFICATION_STATUSES
} from '../config/constants.js';

const eligibilityRulesSchema = new mongoose.Schema(
  {
    allowedDisciplines: {
      type: [{ type: String, enum: ACADEMIC_DISCIPLINES }],
      default: []
    },
    allowedDegreeLevels: {
      type: [{ type: String, enum: DEGREE_LEVELS }],
      default: []
    },
    allowedCourses: {
      type: [String],
      default: []
    },
    allowedYears: {
      type: [Number],
      default: []
    },
    allowedStates: {
      type: [String],
      default: []
    },
    minAge: { type: Number, min: 14, max: 60, default: null },
    maxAge: { type: Number, min: 14, max: 60, default: null },
    openToAllDisciplines: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 500, default: '' }
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    state: { type: String, trim: true, maxlength: 80, default: 'All India' },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    venue: { type: String, trim: true, maxlength: 200, default: '' }
  },
  { _id: false }
);

const teamSizeSchema = new mongoose.Schema(
  {
    min: { type: Number, min: 1, max: 20, default: 1 },
    max: { type: Number, min: 1, max: 20, default: 1 }
  },
  { _id: false }
);

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 180
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320
    },
    fullDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 6000
    },
    category: {
      type: String,
      required: true,
      enum: OPPORTUNITY_CATEGORIES,
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    organizerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    officialSourceUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400
    },
    registrationUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400
    },
    eventMode: {
      type: String,
      required: true,
      enum: EVENT_MODES,
      index: true
    },
    location: {
      type: locationSchema,
      default: () => ({ state: 'All India', city: '', venue: '' })
    },
    eligibilityRules: {
      type: eligibilityRulesSchema,
      default: () => ({})
    },
    feeAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    feeCurrency: {
      type: String,
      default: 'INR',
      maxlength: 10
    },
    deadline: {
      type: Date,
      required: true,
      index: true
    },
    eventStartDate: {
      type: Date,
      required: true
    },
    eventEndDate: {
      type: Date,
      required: true
    },
    teamSize: {
      type: teamSizeSchema,
      default: () => ({ min: 1, max: 1 })
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    beginnerFriendly: {
      type: Boolean,
      default: false,
      index: true
    },
    defaultChecklist: {
      type: [String],
      default: []
    },
    isDemoData: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'pending',
      index: true
    },
    publicationStatus: {
      type: String,
      enum: PUBLICATION_STATUSES,
      default: 'draft',
      index: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submittedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastVerifiedAt: {
      type: Date,
      default: null
    },
    lastCheckedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

opportunitySchema.pre('validate', function validateDatesAndTeam(next) {
  if (this.eventStartDate && this.eventEndDate && this.eventEndDate < this.eventStartDate) {
    this.invalidate('eventEndDate', 'Event end date cannot be earlier than event start date.');
  }
  if (this.deadline && this.eventEndDate && this.deadline > this.eventEndDate) {
    this.invalidate('deadline', 'Registration deadline cannot be after the event end date.');
  }
  if (this.teamSize && this.teamSize.min > this.teamSize.max) {
    this.invalidate('teamSize.max', 'Maximum team size must be >= minimum team size.');
  }
  if (
    this.eligibilityRules?.minAge != null &&
    this.eligibilityRules?.maxAge != null &&
    this.eligibilityRules.minAge > this.eligibilityRules.maxAge
  ) {
    this.invalidate('eligibilityRules.maxAge', 'Maximum age must be >= minimum age.');
  }
  next();
});

opportunitySchema.index({ publicationStatus: 1, verificationStatus: 1, deadline: 1 });
opportunitySchema.index({ category: 1, eventMode: 1, feeAmount: 1, deadline: 1 });
opportunitySchema.index({
  title: 'text',
  shortDescription: 'text',
  fullDescription: 'text',
  organizerName: 'text',
  tags: 'text',
  requiredSkills: 'text'
});

export const Opportunity = mongoose.model('Opportunity', opportunitySchema);

