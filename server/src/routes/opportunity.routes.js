import express from 'express';
import mongoose from 'mongoose';
import { Opportunity } from '../models/Opportunity.js';
import { Bookmark } from '../models/Bookmark.js';
import { Participation } from '../models/Participation.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { scoreOpportunityForStudent } from '../services/recommendationEngine.js';
import {
  opportunityBodySchema,
  opportunityPatchSchema,
  opportunityQuerySchema
} from '../validators/opportunity.validators.js';

const router = express.Router();

function slugifyTitle(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get(
  '/',
  optionalAuth,
  validate({ query: opportunityQuerySchema }),
  async (req, res, next) => {
    try {
      const {
        q,
        category,
        mode,
        feeType,
        state,
        degreeLevel,
        discipline,
        course,
        year,
        deadlineBefore,
        beginnerFriendly,
        includeExpired,
        verificationStatus,
        sort,
        page,
        limit
      } = req.query;

      const now = new Date();
      const filter = {};

      const isAdmin = req.user?.role === 'admin';

      if (isAdmin && verificationStatus) {
        filter.verificationStatus = verificationStatus;
      } else {
        // Ordinary public users only see published, verified listings
        filter.verificationStatus = 'verified';
        if (includeExpired) {
          filter.publicationStatus = { $in: ['published', 'expired'] };
        } else {
          filter.publicationStatus = 'published';
          filter.deadline = { $gt: now };
        }
      }

      if (q) {
        const regex = new RegExp(escapeRegex(q), 'i');
        filter.$or = [
          { title: regex },
          { shortDescription: regex },
          { fullDescription: regex },
          { organizerName: regex },
          { tags: regex },
          { requiredSkills: regex }
        ];
      }

      if (category) filter.category = category;
      if (mode) filter.eventMode = mode;

      if (feeType === 'free') {
        filter.feeAmount = 0;
      } else if (feeType === 'paid') {
        filter.feeAmount = { $gt: 0 };
      }

      if (state && state !== 'All India') {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { 'location.state': state },
            { 'location.state': 'All India' },
            { eventMode: 'online' }
          ]
        });
      }

      if (degreeLevel) {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { 'eligibilityRules.allowedDegreeLevels': degreeLevel },
            { 'eligibilityRules.allowedDegreeLevels': { $size: 0 } }
          ]
        });
      }

      if (discipline) {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { 'eligibilityRules.openToAllDisciplines': true },
            { 'eligibilityRules.allowedDisciplines': discipline }
          ]
        });
      }

      if (course) {
        const cRegex = new RegExp(escapeRegex(course), 'i');
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { 'eligibilityRules.allowedCourses': cRegex },
            { 'eligibilityRules.allowedCourses': { $size: 0 } }
          ]
        });
      }

      if (year) {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { 'eligibilityRules.allowedYears': year },
            { 'eligibilityRules.allowedYears': { $size: 0 } }
          ]
        });
      }

      if (deadlineBefore) {
        filter.deadline = {
          ...(filter.deadline || {}),
          $lte: deadlineBefore
        };
      }

      if (beginnerFriendly !== undefined) {
        filter.beginnerFriendly = beginnerFriendly;
      }

      let sortSpec = { deadline: 1, createdAt: -1 };
      if (sort === 'newest') {
        sortSpec = { createdAt: -1 };
      } else if (sort === 'relevance' && !q) {
        sortSpec = { verificationStatus: 1, deadline: 1 };
      }

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        Opportunity.find(filter).sort(sortSpec).skip(skip).limit(limit).lean(),
        Opportunity.countDocuments(filter)
      ]);

      // Attach bookmark state and explanation summary for logged-in students
      let bookmarkedSet = new Set();
      if (req.user) {
        const oppIds = items.map((i) => i._id);
        const bookmarks = await Bookmark.find({
          userId: req.user._id,
          opportunityId: { $in: oppIds }
        })
          .select('opportunityId')
          .lean();
        bookmarkedSet = new Set(bookmarks.map((b) => String(b.opportunityId)));
      }

      const enriched = items.map((item) => {
        const out = {
          ...item,
          isBookmarked: bookmarkedSet.has(String(item._id))
        };
        if (req.user?.role === 'student') {
          const exp = scoreOpportunityForStudent(req.user, item, undefined, now);
          out.matchSummary = {
            score: exp.score,
            eligibility: exp.eligibility,
            reasons: exp.reasons.slice(0, 2)
          };
        }
        return out;
      });

      if (sort === 'relevance' && req.user?.role === 'student') {
        enriched.sort((a, b) => (b.matchSummary?.score || 0) - (a.matchSummary?.score || 0));
      }

      res.json({
        success: true,
        data: {
          opportunities: enriched,
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
  }
);

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const opportunity = await Opportunity.findOne(query).lean();

    if (!opportunity) {
      return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
    }

    const isOwner = req.user && String(opportunity.organizerId) === String(req.user._id);
    const isAdmin = req.user?.role === 'admin';
    const isPubliclyVisible =
      opportunity.verificationStatus === 'verified' &&
      ['published', 'expired'].includes(opportunity.publicationStatus);

    if (!isPubliclyVisible && !isOwner && !isAdmin) {
      return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
    }

    let isBookmarked = false;
    let participation = null;
    let explanation = null;

    if (req.user) {
      const [bm, part] = await Promise.all([
        Bookmark.findOne({ userId: req.user._id, opportunityId: opportunity._id }).lean(),
        Participation.findOne({ userId: req.user._id, opportunityId: opportunity._id }).lean()
      ]);
      isBookmarked = Boolean(bm);
      participation = part;

      if (req.user.role === 'student') {
        explanation = scoreOpportunityForStudent(req.user, opportunity);
      }
    }

    return res.json({
      success: true,
      data: {
        opportunity,
        isBookmarked,
        participation,
        explanation
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireRole('organizer', 'admin'),
  validate({ body: opportunityBodySchema }),
  async (req, res, next) => {
    try {
      const body = req.body;
      const organizerName =
        body.organizerName || req.user.organizerProfile?.organizationName || req.user.name;

      const opportunity = await Opportunity.create({
        ...body,
        slug: slugifyTitle(body.title),
        organizerId: req.user._id,
        organizerName,
        submittedBy: req.user._id,
        verificationStatus: 'pending',
        publicationStatus: 'draft'
      });

      return res.status(201).json({
        success: true,
        data: { opportunity }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  validate({ body: opportunityPatchSchema }),
  async (req, res, next) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) {
        return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
      }

      const isOwner = String(opportunity.organizerId) === String(req.user._id);
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return next(
          new AppError(403, 'FORBIDDEN', 'You can only edit your own opportunity listings.')
        );
      }

      Object.assign(opportunity, req.body);

      // Organizers editing a previously verified listing trigger re-review
      if (!isAdmin && opportunity.verificationStatus === 'verified') {
        opportunity.verificationStatus = 'needs_review';
        opportunity.publicationStatus = 'draft';
      }

      await opportunity.save();

      return res.json({
        success: true,
        data: { opportunity }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  async (req, res, next) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) {
        return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
      }

      const isOwner = String(opportunity.organizerId) === String(req.user._id);
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return next(
          new AppError(403, 'FORBIDDEN', 'You can only delete your own opportunity listings.')
        );
      }

      if (!isAdmin && opportunity.publicationStatus === 'published') {
        return next(
          new AppError(
            400,
            'CANNOT_DELETE_PUBLISHED',
            'Published listings cannot be deleted directly by organizers. Contact an administrator.'
          )
        );
      }

      await opportunity.deleteOne();
      return res.json({
        success: true,
        data: { message: 'Opportunity deleted.' }
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

