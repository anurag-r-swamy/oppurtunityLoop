import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { User } from '../models/User.js';
import { Opportunity } from '../models/Opportunity.js';
import { Participation } from '../models/Participation.js';
import { Report } from '../models/Report.js';
import { Category } from '../models/Category.js';
import { PlatformSetting } from '../models/PlatformSetting.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { recordAuditLog } from '../services/auditService.js';
import { markExpiredOpportunities } from '../services/reminderService.js';
import {
  categorySchema,
  platformSettingsSchema,
  rejectOpportunitySchema,
  reviewReportSchema
} from '../validators/admin.validators.js';

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/dashboard', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      publishedOpportunities,
      pendingVerifications,
      expiredListings,
      totalParticipations,
      openReports,
      participationByCategory
    ] = await Promise.all([
      User.countDocuments(),
      Opportunity.countDocuments({ publicationStatus: 'published', verificationStatus: 'verified' }),
      Opportunity.countDocuments({
        verificationStatus: { $in: ['pending', 'needs_review'] },
        publicationStatus: { $ne: 'archived' }
      }),
      Opportunity.countDocuments({ publicationStatus: 'expired' }),
      Participation.countDocuments(),
      Report.countDocuments({ status: { $in: ['open', 'under_review'] } }),
      Participation.aggregate([
        {
          $lookup: {
            from: 'opportunities',
            localField: 'opportunityId',
            foreignField: '_id',
            as: 'opp'
          }
        },
        { $unwind: '$opp' },
        {
          $group: {
            _id: '$opp.category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          publishedOpportunities,
          pendingVerifications,
          expiredListings,
          totalParticipations,
          openReports
        },
        participationByCategory: participationByCategory.map((row) => ({
          category: row._id,
          count: row.count
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities/pending', async (_req, res, next) => {
  try {
    const opportunities = await Opportunity.find({
      verificationStatus: { $in: ['pending', 'needs_review'] },
      publicationStatus: { $ne: 'archived' }
    })
      .populate('submittedBy', 'name email role')
      .sort({ submittedAt: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: { opportunities }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
    if (req.query.publicationStatus) filter.publicationStatus = req.query.publicationStatus;

    const opportunities = await Opportunity.find(filter)
      .populate('submittedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: { opportunities }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/opportunities/:id/verify', async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
    }

    const now = new Date();
    opp.verificationStatus = 'verified';
    opp.publicationStatus = opp.deadline < now ? 'expired' : 'published';
    opp.verifiedBy = req.user._id;
    opp.lastVerifiedAt = now;
    opp.lastCheckedAt = now;
    opp.rejectionReason = '';
    await opp.save();

    await Notification.create({
      userId: opp.organizerId,
      type: 'listing_status',
      title: `Listing verified: ${opp.title}`,
      message: `Your opportunity "${opp.title}" has been verified and published.`,
      relatedOpportunityId: opp._id,
      sentAt: now,
      status: 'sent'
    });

    await recordAuditLog({
      actorId: req.user._id,
      action: 'OPPORTUNITY_VERIFIED',
      entityType: 'Opportunity',
      entityId: opp._id,
      metadata: { title: opp.title, publicationStatus: opp.publicationStatus }
    });

    return res.json({
      success: true,
      data: { opportunity: opp }
    });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/opportunities/:id/reject',
  validate({ body: rejectOpportunitySchema }),
  async (req, res, next) => {
    try {
      const opp = await Opportunity.findById(req.params.id);
      if (!opp) {
        return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
      }

      opp.verificationStatus = req.body.verificationStatus;
      opp.publicationStatus = 'draft';
      opp.rejectionReason = req.body.reason;
      opp.lastCheckedAt = new Date();
      await opp.save();

      await Notification.create({
        userId: opp.organizerId,
        type: 'listing_status',
        title: `Listing ${req.body.verificationStatus === 'needs_review' ? 'needs revision' : 'rejected'}: ${opp.title}`,
        message: `Reviewer note: ${req.body.reason}`,
        relatedOpportunityId: opp._id,
        sentAt: new Date(),
        status: 'sent'
      });

      await recordAuditLog({
        actorId: req.user._id,
        action: 'OPPORTUNITY_REJECTED',
        entityType: 'Opportunity',
        entityId: opp._id,
        metadata: {
          verificationStatus: req.body.verificationStatus,
          reason: req.body.reason
        }
      });

      return res.json({
        success: true,
        data: { opportunity: opp }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch('/opportunities/:id/archive', async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return next(new AppError(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity not found.'));
    }

    opp.publicationStatus = 'archived';
    await opp.save();

    await recordAuditLog({
      actorId: req.user._id,
      action: 'OPPORTUNITY_ARCHIVED',
      entityType: 'Opportunity',
      entityId: opp._id,
      metadata: { title: opp.title }
    });

    return res.json({
      success: true,
      data: { opportunity: opp }
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/opportunities/mark-expired', async (req, res, next) => {
  try {
    const modifiedCount = await markExpiredOpportunities();
    await recordAuditLog({
      actorId: req.user._id,
      action: 'MARK_EXPIRED_OPPORTUNITIES',
      entityType: 'Opportunity',
      entityId: req.user._id,
      metadata: { modifiedCount }
    });
    res.json({
      success: true,
      data: { modifiedCount }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reports', async (_req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('submittedBy', 'name email role')
      .populate('opportunityId', 'title slug verificationStatus publicationStatus')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { reports }
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/reports/:id',
  validate({ body: reviewReportSchema }),
  async (req, res, next) => {
    try {
      const report = await Report.findById(req.params.id);
      if (!report) {
        return next(new AppError(404, 'REPORT_NOT_FOUND', 'Report not found.'));
      }

      report.status = req.body.status;
      report.resolutionNote = req.body.resolutionNote;
      report.reviewedBy = req.user._id;
      report.reviewedAt = new Date();
      await report.save();

      await recordAuditLog({
        actorId: req.user._id,
        action: 'REPORT_REVIEWED',
        entityType: 'Report',
        entityId: report._id,
        metadata: { status: report.status, opportunityId: report.opportunityId }
      });

      return res.json({
        success: true,
        data: { report }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/users', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.accountStatus) filter.accountStatus = req.query.accountStatus;

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: { users }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { accountStatus } = req.body;
    if (!['active', 'suspended'].includes(accountStatus)) {
      return next(new AppError(400, 'INVALID_STATUS', 'Invalid account status.'));
    }
    if (String(req.params.id) === String(req.user._id)) {
      return next(new AppError(400, 'CANNOT_MODIFY_SELF', 'You cannot suspend your own account.'));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { accountStatus } },
      { new: true }
    )
      .select('-passwordHash')
      .lean();

    if (!user) {
      return next(new AppError(404, 'USER_NOT_FOUND', 'User not found.'));
    }

    await recordAuditLog({
      actorId: req.user._id,
      action: 'USER_STATUS_CHANGED',
      entityType: 'User',
      entityId: user._id,
      metadata: { accountStatus }
    });

    return res.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', validate({ body: categorySchema }), async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    await recordAuditLog({
      actorId: req.user._id,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category._id,
      metadata: { slug: category.slug }
    });
    res.status(201).json({ success: true, data: { category } });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/categories/:id',
  validate({ body: categorySchema.partial() }),
  async (req, res, next) => {
    try {
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      ).lean();
      if (!category) {
        return next(new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found.'));
      }
      await recordAuditLog({
        actorId: req.user._id,
        action: 'CATEGORY_UPDATED',
        entityType: 'Category',
        entityId: category._id,
        metadata: { slug: category.slug }
      });
      return res.json({ success: true, data: { category } });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/settings', async (_req, res, next) => {
  try {
    let settings = await PlatformSetting.findOne({ key: 'global' }).lean();
    if (!settings) {
      settings = await PlatformSetting.create({ key: 'global' });
    }
    res.json({ success: true, data: { settings } });
  } catch (err) {
    next(err);
  }
});

router.patch('/settings', validate({ body: platformSettingsSchema }), async (req, res, next) => {
  try {
    const settings = await PlatformSetting.findOneAndUpdate(
      { key: 'global' },
      { $set: { ...req.body, updatedBy: req.user._id } },
      { new: true, upsert: true }
    ).lean();

    await recordAuditLog({
      actorId: req.user._id,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entityType: 'PlatformSetting',
      entityId: settings._id,
      metadata: req.body
    });

    res.json({ success: true, data: { settings } });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/participation', async (_req, res, next) => {
  try {
    const [byCategory, byDiscipline, byStatus] = await Promise.all([
      Participation.aggregate([
        {
          $lookup: {
            from: 'opportunities',
            localField: 'opportunityId',
            foreignField: '_id',
            as: 'opp'
          }
        },
        { $unwind: '$opp' },
        { $group: { _id: '$opp.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Participation.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' },
        {
          $group: {
            _id: {
              $ifNull: ['$student.studentProfile.discipline', 'Unspecified']
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Participation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        byCategory: byCategory.map((r) => ({ category: r._id, count: r.count })),
        byDiscipline: byDiscipline.map((r) => ({
          discipline: r._id || 'Unspecified',
          count: r.count
        })),
        byStatus: byStatus.map((r) => ({ status: r._id, count: r.count }))
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs', async (_req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: { logs }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

