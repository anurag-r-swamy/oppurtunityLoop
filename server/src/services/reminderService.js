import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { Bookmark } from '../models/Bookmark.js';
import { Notification } from '../models/Notification.js';
import { Opportunity } from '../models/Opportunity.js';
import { Participation } from '../models/Participation.js';
import { User } from '../models/User.js';

let mailer = null;

function getMailer() {
  if (mailer) return mailer;
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    mailer = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }
  return mailer;
}

export async function markExpiredOpportunities(now = new Date()) {
  const result = await Opportunity.updateMany(
    {
      publicationStatus: 'published',
      deadline: { $lt: now }
    },
    {
      $set: { publicationStatus: 'expired' }
    }
  );
  return result.modifiedCount || 0;
}

export async function generateDeadlineReminders(now = new Date()) {
  const maxDays = 7;
  const maxWindowEnd = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  const upcomingOpps = await Opportunity.find({
    publicationStatus: 'published',
    deadline: { $gt: now, $lte: maxWindowEnd }
  })
    .select('_id title deadline')
    .lean();

  if (!upcomingOpps.length) return { created: 0, emailed: 0 };

  const oppMap = new Map(upcomingOpps.map((o) => [String(o._id), o]));
  const oppIds = upcomingOpps.map((o) => o._id);

  const [bookmarks, participations] = await Promise.all([
    Bookmark.find({ opportunityId: { $in: oppIds } }).lean(),
    Participation.find({
      opportunityId: { $in: oppIds },
      status: { $in: ['interested', 'registered', 'preparing'] }
    }).lean()
  ]);

  const userOppPairs = new Map();
  for (const b of bookmarks) {
    userOppPairs.set(`${b.userId}:${b.opportunityId}`, {
      userId: String(b.userId),
      opportunityId: String(b.opportunityId)
    });
  }
  for (const p of participations) {
    userOppPairs.set(`${p.userId}:${p.opportunityId}`, {
      userId: String(p.userId),
      opportunityId: String(p.opportunityId)
    });
  }

  if (!userOppPairs.size) return { created: 0, emailed: 0 };

  const userIds = [...new Set([...userOppPairs.values()].map((v) => v.userId))];
  const users = await User.find({
    _id: { $in: userIds },
    accountStatus: 'active'
  })
    .select('_id name email notificationPreferences')
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  let created = 0;
  let emailed = 0;
  const transport = getMailer();

  for (const pair of userOppPairs.values()) {
    const user = userMap.get(pair.userId);
    const opp = oppMap.get(pair.opportunityId);
    if (!user || !opp) continue;

    const prefs = user.notificationPreferences || {};
    if (prefs.inAppReminders === false && !prefs.emailReminders) continue;

    const daysLeft = Math.ceil((new Date(opp.deadline).getTime() - now.getTime()) / (86400 * 1000));
    const configuredDays = (prefs.reminderDaysBefore?.length ? prefs.reminderDaysBefore : [7, 3, 1])
      .slice()
      .sort((a, b) => a - b);

    const matchingWindow = configuredDays.find((d) => daysLeft <= d);
    if (matchingWindow == null) continue;

    const reminderWindowKey = `deadline-${matchingWindow}d`;
    const title = `Deadline in ${daysLeft} day${daysLeft === 1 ? '' : 's'}: ${opp.title}`;
    const message = `The registration deadline for "${opp.title}" is on ${new Date(opp.deadline).toDateString()}. Check your preparation checklist and complete your registration.`;

    try {
      const notif = await Notification.create({
        userId: user._id,
        type: 'deadline_reminder',
        title,
        message,
        relatedOpportunityId: opp._id,
        reminderWindowKey,
        scheduledAt: now,
        sentAt: now,
        status: 'sent'
      });
      if (notif) created += 1;

      if (transport && prefs.emailReminders && user.email) {
        await transport.sendMail({
          from: env.SMTP_FROM,
          to: user.email,
          subject: `[OpportunityLoop] ${title}`,
          text: message
        });
        emailed += 1;
      }
    } catch (err) {
      // Ignore duplicate reminder key (11000) to guarantee idempotency
      if (err.code !== 11000) {
        console.error('Reminder generation error:', err.message);
      }
    }
  }

  return { created, emailed };
}

export function startReminderScheduler() {
  const intervalMs = env.REMINDER_INTERVAL_MINUTES * 60 * 1000;
  const runJob = async () => {
    try {
      await markExpiredOpportunities();
      await generateDeadlineReminders();
    } catch (err) {
      console.error('Scheduled reminder job error:', err.message);
    }
  };

  const timer = setInterval(runJob, intervalMs);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
  return timer;
}

