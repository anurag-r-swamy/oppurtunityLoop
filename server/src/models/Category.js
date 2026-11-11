import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);

