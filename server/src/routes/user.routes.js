import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { User } from '../models/User.js';
import { Bookmark } from '../models/Bookmark.js';
import { Participation } from '../models/Participation.js';
import { Notification } from '../models/Notification.js';
import { Opportunity } from '../models/Opportunity.js';
import { rankOpportunitiesForStudent } from '../services/recommendationEngine.js';
import { updateProfileSchema } from '../validators/user.validators.js';

const router = express.Router();

router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

router.patch('/me', authenticate, validate({ body: updateProfileSchema }), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError(404, 'USER_NOT_FOUND', 'User not found.'));
    }

    const { name, studentProfile, organizerProfile, notificationPreferences } = req.body;

    if (name !== undefined) {
      user.name = name;
    }

    if (studentProfile && user.role === 'student') {
      user.studentProfile = {
        ...(user.studentProfile?.toObject?.() || user.studentProfile || {}),
        ...studentProfile
      };
    }

    if (organizerProfile && (user.role === 'organizer' || user.role === 'admin')) {
      user.organizerProfile = {
        ...(user.organizerProfile?.toObject?.() || user.organizerProfile || {}),
        ...organizerProfile
      };
    }

    if (notificationPreferences) {
      user.notificationPreferences = {
        ...(user.notificationPreferences?.toObject?.() || user.notificationPreferences || {}),
        ...notificationPreferences
      };
    }

    await user.save();
    const clean = user.toObject();
    delete clean.passwordHash;

    return res.json({
      success: true,
      data: { user: clean }
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/me/dashboard', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const now = new Date();
    const userId = req.user._id;

    const [bookmarks, participations, unreadNotifications, recentNotifications, activeOpps] =
      await Promise.all([
        Bookmark.find({ userId })
          .populate('opportunityId')
          .sort({ createdAt: -1 })
          .lean(),
        Participation.find({ userId })
          .populate('opportunityId')
          .sort({ updatedAt: -1 })
          .lean(),
        Notification.countDocuments({ userId, readAt: null }),
        Notification.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
        Opportunity.find({
          publicationStatus: 'published',
          verificationStatus: 'verified',
          deadline: { $gt: now }
        })
          .sort({ deadline: 1 })
          .limit(40)
          .lean()
      ]);

    const ranked = rankOpportunitiesForStudent(req.user, activeOpps, { now }).slice(0, 4);

    // Upcoming deadlines from saved or active participations
    const trackedMap = new Map();
    for (const b of bookmarks) {
      if (b.opportunityId && new Date(b.opportunityId.deadline) > now) {
        trackedMap.set(String(b.opportunityId._id), {
          ...b.opportunityId,
          source: 'saved'
        });
      }
    }
    for (const p of participations) {
      if (
        p.opportunityId &&
        new Date(p.opportunityId.deadline) > now &&
        ['interested', 'registered', 'preparing'].includes(p.status)
      ) {
        trackedMap.set(String(p.opportunityId._id), {
          ...p.opportunityId,
          source: 'participation',
          participationStatus: p.status
        });
      }
    }

    const upcomingDeadlines = [...trackedMap.values()]
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    let totalChecklistItems = 0;
    let completedChecklistItems = 0;
    let activeCount = 0;
    let completedCount = 0;
    let achievementsCount = 0;

    for (const p of participations) {
      if (['interested', 'registered', 'preparing', 'submitted'].includes(p.status)) {
        activeCount += 1;
      }
      if (['participated', 'won'].includes(p.status)) {
        completedCount += 1;
        achievementsCount += 1;
      }
      for (const item of p.preparationChecklist || []) {
        totalChecklistItems += 1;
        if (item.completed) completedChecklistItems += 1;
      }
    }

    res.json({
      success: true,
      data: {
        profileCompletion: req.user.studentProfile?.profileCompletionStatus ?? 0,
        stats: {
          savedCount: bookmarks.length,
          activeParticipations: activeCount,
          completedParticipations: completedCount,
          achievementsCount,
          unreadNotifications,
          checklistProgress: {
            completed: completedChecklistItems,
            total: totalChecklistItems
          }
        },
        recommended: ranked,
        upcomingDeadlines,
        recentParticipations: participations.slice(0, 5),
        recentNotifications
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

