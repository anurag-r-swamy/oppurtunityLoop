import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
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
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookmarkSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

