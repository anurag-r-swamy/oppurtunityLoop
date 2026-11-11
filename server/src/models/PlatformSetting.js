import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    teamMatchingEnabled: {
      type: Boolean,
      default: true
    },
    requireAdminVerification: {
      type: Boolean,
      default: true
    },
    defaultReminderDays: {
      type: [Number],
      default: [7, 3, 1]
    },
    maintenanceBanner: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

export const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema);

