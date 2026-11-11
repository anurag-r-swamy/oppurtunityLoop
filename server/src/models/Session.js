import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }
    },
    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Session = mongoose.model('Session', sessionSchema);

