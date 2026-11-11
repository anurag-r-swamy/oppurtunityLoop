import express from 'express';
import { Bookmark } from '../models/Bookmark.js';
import { Opportunity } from '../models/Opportunity.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/bookmarks', authenticate, async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .populate('opportunityId')
      .sort({ createdAt: -1 })
      .lean();

    const valid = bookmarks.filter((b) => Boolean(b.opportunityId));

    res.json({
      success: true,
      data: {
        bookmarks: valid
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/opportunities/:id/bookmark', authenticate, async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id).lean();
    if (!opp) {
      return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
    }

    const existing = await Bookmark.findOne({
      userId: req.user._id,
      opportunityId: opp._id
    }).lean();

    if (existing) {
      return next(
        new AppError(409, 'ALREADY_BOOKMARKED', 'You have already bookmarked this opportunity.')
      );
    }

    const bookmark = await Bookmark.create({
      userId: req.user._id,
      opportunityId: opp._id
    });

    return res.status(201).json({
      success: true,
      data: { bookmark }
    });
  } catch (err) {
    return next(err);
  }
});

router.delete('/opportunities/:id/bookmark', authenticate, async (req, res, next) => {
  try {
    const deleted = await Bookmark.findOneAndDelete({
      userId: req.user._id,
      opportunityId: req.params.id
    });

    if (!deleted) {
      return next(new AppError(404, 'BOOKMARK_NOT_FOUND', 'Bookmark not found.'));
    }

    return res.json({
      success: true,
      data: { message: 'Bookmark removed.' }
    });
  } catch (err) {
    return next(err);
  }
});

export default router;

