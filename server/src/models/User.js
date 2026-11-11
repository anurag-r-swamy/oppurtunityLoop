import mongoose from 'mongoose';
import {
  ACADEMIC_DISCIPLINES,
  ACCOUNT_STATUSES,
  DEGREE_LEVELS,
  EVENT_MODES,
  EXPERIENCE_LEVELS,
  OPPORTUNITY_CATEGORIES,
  USER_ROLES
} from '../config/constants.js';

const studentProfileSchema = new mongoose.Schema(
  {
    collegeName: { type: String, trim: true, maxlength: 160, default: '' },
    course: { type: String, trim: true, maxlength: 120, default: '' },
    discipline: {
      type: String,
      enum: [...ACADEMIC_DISCIPLINES, ''],
      default: ''
    },
    degreeLevel: {
      type: String,
      enum: [...DEGREE_LEVELS, ''],
      default: ''
    },
    currentYear: { type: Number, min: 1, max: 7, default: null },
    age: { type: Number, min: 15, max: 60, default: null },
    state: { type: String, trim: true, maxlength: 80, default: '' },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: [...EXPERIENCE_LEVELS, ''],
      default: 'beginner'
    },
    preferredEventModes: {
      type: [{ type: String, enum: EVENT_MODES }],
      default: []
    },
    preferredCategories: {
      type: [{ type: String, enum: OPPORTUNITY_CATEGORIES }],
      default: []
    },
    availabilityPreferences: {
      type: String,
      enum: ['weekdays', 'weekends', 'flexible', ''],
      default: 'flexible'
    },
    profileCompletionStatus: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
);

const organizerProfileSchema = new mongoose.Schema(
  {
    organizationName: { type: String, trim: true, maxlength: 160, default: '' },
    organizationType: {
      type: String,
      enum: ['college-club', 'university', 'company', 'nonprofit', 'community', ''],
      default: ''
    },
    websiteUrl: { type: String, trim: true, maxlength: 300, default: '' },
    description: { type: String, trim: true, maxlength: 1000, default: '' }
  },
  { _id: false }
);

const notificationPreferencesSchema = new mongoose.Schema(
  {
    inAppReminders: { type: Boolean, default: true },
    emailReminders: { type: Boolean, default: false },
    reminderDaysBefore: { type: [Number], default: [7, 3, 1] },
    teamUpdates: { type: Boolean, default: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 180
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'student'
    },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: 'active'
    },
    studentProfile: {
      type: studentProfileSchema,
      default: () => ({})
    },
    organizerProfile: {
      type: organizerProfileSchema,
      default: () => ({})
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ 'studentProfile.discipline': 1 });

export function computeProfileCompletion(profile = {}) {
  const checks = [
    Boolean(profile.collegeName),
    Boolean(profile.course),
    Boolean(profile.discipline),
    Boolean(profile.degreeLevel),
    Boolean(profile.currentYear),
    Boolean(profile.state),
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Array.isArray(profile.interests) && profile.interests.length > 0,
    Boolean(profile.experienceLevel),
    Array.isArray(profile.preferredEventModes) && profile.preferredEventModes.length > 0
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

userSchema.pre('save', function updateProfileCompletion(next) {
  if (this.role === 'student') {
    this.studentProfile.profileCompletionStatus = computeProfileCompletion(this.studentProfile);
  }
  next();
});

export const User = mongoose.model('User', userSchema);

