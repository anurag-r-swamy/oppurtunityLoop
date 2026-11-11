import express from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDeadlineReminders } from '../services/reminderService.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('relatedOpportunityId', 'title slug deadline')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true }
    ).lean();

    if (!notif) {
      return next(new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.'));
    }

    return res.json({
      success: true,
      data: { notification: notif }
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({
      success: true,
      data: { message: 'All notifications marked as read.' }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/check-deadlines', authenticate, async (_req, res, next) => {
  try {
    const result = await generateDeadlineReminders();
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

export default router;

