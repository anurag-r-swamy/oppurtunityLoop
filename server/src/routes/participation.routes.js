import express from 'express';
import { Participation } from '../models/Participation.js';
import { Opportunity } from '../models/Opportunity.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { PARTICIPATION_STATUSES, PARTICIPATION_TRANSITIONS } from '../config/constants.js';
import {
  createParticipationSchema,
  updateParticipationSchema
} from '../validators/participation.validators.js';

const router = express.Router();

router.get('/participations', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status && PARTICIPATION_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const participations = await Participation.find(filter)
      .populate('opportunityId')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { participations }
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/opportunities/:id/participation',
  authenticate,
  requireRole('student'),
  validate({ body: createParticipationSchema }),
  async (req, res, next) => {
    try {
      const opp = await Opportunity.findById(req.params.id).lean();
      if (!opp) {
        return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
      }

      const existing = await Participation.findOne({
        userId: req.user._id,
        opportunityId: opp._id
      }).lean();

      if (existing) {
        return next(
          new AppError(
            409,
            'PARTICIPATION_EXISTS',
            'You are already tracking participation for this opportunity.'
          )
        );
      }

      const checklist =
        req.body.preparationChecklist && req.body.preparationChecklist.length > 0
          ? req.body.preparationChecklist
          : (opp.defaultChecklist?.length
              ? opp.defaultChecklist
              : [
                  'Verify eligibility criteria on official source',
                  'Prepare required documents / portfolio / resume',
                  'Complete external registration before deadline',
                  'Save confirmation receipt and submission links'
                ]
            ).map((text) => ({ text, completed: false }));

      const now = new Date();
      const status = req.body.status || 'interested';

      const participation = await Participation.create({
        userId: req.user._id,
        opportunityId: opp._id,
        status,
        preparationChecklist: checklist,
        registrationUrl: req.body.registrationUrl || opp.registrationUrl,
        personalNotes: req.body.personalNotes || '',
        registeredAt: status === 'registered' ? now : null,
        submittedAt: status === 'submitted' ? now : null,
        participatedAt: ['participated', 'won'].includes(status) ? now : null,
        verificationOrigin: 'self_reported'
      });

      const populated = await Participation.findById(participation._id)
        .populate('opportunityId')
        .lean();

      return res.status(201).json({
        success: true,
        data: { participation: populated }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/participations/:id', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const participation = await Participation.findById(req.params.id)
      .populate('opportunityId')
      .lean();

    if (!participation) {
      return next(new AppError(404, 'PARTICIPATION_NOT_FOUND', 'Participation record not found.'));
    }

    if (String(participation.userId) !== String(req.user._id)) {
      return next(
        new AppError(403, 'FORBIDDEN', 'You cannot access another student’s participation record.')
      );
    }

    return res.json({
      success: true,
      data: { participation }
    });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/participations/:id',
  authenticate,
  requireRole('student'),
  validate({ body: updateParticipationSchema }),
  async (req, res, next) => {
    try {
      const participation = await Participation.findById(req.params.id);
      if (!participation) {
        return next(
          new AppError(404, 'PARTICIPATION_NOT_FOUND', 'Participation record not found.')
        );
      }

      if (String(participation.userId) !== String(req.user._id)) {
        return next(
          new AppError(403, 'FORBIDDEN', 'You cannot modify another student’s participation record.')
        );
      }

      const { status, registrationUrl, outcome, evidenceUrl, personalNotes, preparationChecklist } =
        req.body;

      if (status && status !== participation.status) {
        const allowedNext = PARTICIPATION_TRANSITIONS[participation.status] || [];
        if (!allowedNext.includes(status)) {
          return next(
            new AppError(
              400,
              'INVALID_STATUS_TRANSITION',
              `Cannot transition participation status from "${participation.status}" to "${status}".`
            )
          );
        }
        participation.status = status;
        const now = new Date();
        if (status === 'registered' && !participation.registeredAt) {
          participation.registeredAt = now;
        }
        if (status === 'submitted' && !participation.submittedAt) {
          participation.submittedAt = now;
        }
        if (['participated', 'won'].includes(status) && !participation.participatedAt) {
          participation.participatedAt = now;
        }
      }

      if (registrationUrl !== undefined) participation.registrationUrl = registrationUrl;
      if (outcome !== undefined) participation.outcome = outcome;
      if (evidenceUrl !== undefined) participation.evidenceUrl = evidenceUrl;
      if (personalNotes !== undefined) participation.personalNotes = personalNotes;
      if (preparationChecklist !== undefined) {
        participation.preparationChecklist = preparationChecklist.map((item) => ({
          ...item,
          completedAt: item.completed ? item.completedAt || new Date() : null
        }));
      }

      await participation.save();
      const populated = await Participation.findById(participation._id)
        .populate('opportunityId')
        .lean();

      return res.json({
        success: true,
        data: { participation: populated }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete(
  '/participations/:id',
  authenticate,
  requireRole('student'),
  async (req, res, next) => {
    try {
      const participation = await Participation.findById(req.params.id);
      if (!participation) {
        return next(
          new AppError(404, 'PARTICIPATION_NOT_FOUND', 'Participation record not found.')
        );
      }

      if (String(participation.userId) !== String(req.user._id)) {
        return next(
          new AppError(403, 'FORBIDDEN', 'You cannot delete another student’s participation record.')
        );
      }

      await participation.deleteOne();
      return res.json({
        success: true,
        data: { message: 'Participation record deleted.' }
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

