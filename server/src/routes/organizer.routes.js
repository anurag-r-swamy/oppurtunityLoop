import express from 'express';
import { Opportunity } from '../models/Opportunity.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  opportunityBodySchema,
  opportunityPatchSchema
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

router.use(authenticate, requireRole('organizer', 'admin'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const filter = { organizerId: req.user._id };
    const all = await Opportunity.find(filter).sort({ updatedAt: -1 }).lean();

    const stats = {
      total: all.length,
      drafts: all.filter((o) => o.publicationStatus === 'draft').length,
      pendingVerification: all.filter(
        (o) =>
          o.submittedAt &&
          ['pending', 'needs_review'].includes(o.verificationStatus)
      ).length,
      published: all.filter((o) => o.publicationStatus === 'published').length,
      rejected: all.filter((o) => o.verificationStatus === 'rejected').length,
      expired: all.filter((o) => o.publicationStatus === 'expired').length
    };

    res.json({
      success: true,
      data: {
        stats,
        recentOpportunities: all.slice(0, 8)
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities', async (req, res, next) => {
  try {
    const opportunities = await Opportunity.find({ organizerId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();
    res.json({
      success: true,
      data: { opportunities }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities/:id', async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).lean();
    if (!opportunity) {
      return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
    }
    if (String(opportunity.organizerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return next(new AppError(403, 'FORBIDDEN', 'You can only view your own listings.'));
    }
    return res.json({
      success: true,
      data: { opportunity }
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/opportunities',
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
  '/opportunities/:id',
  validate({ body: opportunityPatchSchema }),
  async (req, res, next) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) {
        return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
      }
      if (String(opportunity.organizerId) !== String(req.user._id) && req.user.role !== 'admin') {
        return next(new AppError(403, 'FORBIDDEN', 'You can only edit your own listings.'));
      }

      Object.assign(opportunity, req.body);

      if (req.user.role !== 'admin' && opportunity.verificationStatus === 'verified') {
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

router.post('/opportunities/:id/submit', async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
    }
    if (String(opportunity.organizerId) !== String(req.user._id) && req.user.role !== 'admin') {
      return next(
        new AppError(403, 'FORBIDDEN', 'You can only submit your own listings for review.')
      );
    }

    // Organizers cannot approve their own listings; submitting queues it for admin verification
    opportunity.verificationStatus = 'pending';
    opportunity.submittedAt = new Date();
    opportunity.rejectionReason = '';
    await opportunity.save();

    return res.json({
      success: true,
      data: { opportunity }
    });
  } catch (err) {
    return next(err);
  }
});

export default router;

