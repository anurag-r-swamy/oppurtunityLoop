import express from 'express';
import { Report } from '../models/Report.js';
import { Opportunity } from '../models/Opportunity.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { createReportSchema } from '../validators/admin.validators.js';

const router = express.Router();

router.post('/', authenticate, validate({ body: createReportSchema }), async (req, res, next) => {
  try {
    const { opportunityId, reason, description } = req.body;
    const opp = await Opportunity.findById(opportunityId).lean();
    if (!opp) {
      return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
    }

    const report = await Report.create({
      submittedBy: req.user._id,
      opportunityId: opp._id,
      reason,
      description
    });

    return res.status(201).json({
      success: true,
      data: { report }
    });
  } catch (err) {
    return next(err);
  }
});

export default router;

