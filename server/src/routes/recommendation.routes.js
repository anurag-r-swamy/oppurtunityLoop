import express from 'express';
import { Opportunity } from '../models/Opportunity.js';
import { Bookmark } from '../models/Bookmark.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  rankOpportunitiesForStudent,
  scoreOpportunityForStudent
} from '../services/recommendationEngine.js';

const router = express.Router();

router.get('/', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const now = new Date();
    const includeIneligible = req.query.includeIneligible === 'true';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));

    const activeOpportunities = await Opportunity.find({
      publicationStatus: 'published',
      verificationStatus: 'verified',
      deadline: { $gt: now }
    }).lean();

    const ranked = rankOpportunitiesForStudent(req.user, activeOpportunities, {
      includeIneligible,
      now
    });

    const total = ranked.length;
    const start = (page - 1) * limit;
    const paged = ranked.slice(start, start + limit);

    const oppIds = paged.map((r) => r.opportunity._id);
    const bookmarks = await Bookmark.find({
      userId: req.user._id,
      opportunityId: { $in: oppIds }
    })
      .select('opportunityId')
      .lean();
    const bookmarkedSet = new Set(bookmarks.map((b) => String(b.opportunityId)));

    const recommendations = paged.map((item) => ({
      opportunity: {
        ...item.opportunity,
        isBookmarked: bookmarkedSet.has(String(item.opportunity._id))
      },
      explanation: item.explanation
    }));

    res.json({
      success: true,
      data: {
        recommendations,
        profileCompletion: req.user.studentProfile?.profileCompletionStatus ?? 0,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit))
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/:opportunityId/explanation',
  authenticate,
  requireRole('student'),
  async (req, res, next) => {
    try {
      const opportunity = await Opportunity.findById(req.params.opportunityId).lean();
      if (!opportunity) {
        return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
      }

      const explanation = scoreOpportunityForStudent(req.user, opportunity);
      return res.json({
        success: true,
        data: { explanation }
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

