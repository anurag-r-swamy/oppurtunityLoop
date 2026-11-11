import express from 'express';
import { getDBStatus } from '../config/db.js';
import { Category } from '../models/Category.js';
import { PlatformSetting } from '../models/PlatformSetting.js';
import { OPPORTUNITY_CATEGORIES } from '../config/constants.js';

const router = express.Router();

router.get('/health', (_req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      service: 'opportunityloop-api',
      status: isHealthy ? 'ok' : 'degraded',
      database: dbStatus,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
});

router.get('/meta/public', async (_req, res, next) => {
  try {
    const [categories, settings] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      PlatformSetting.findOne({ key: 'global' }).lean()
    ]);

    const effectiveCategories = categories.length
      ? categories
      : OPPORTUNITY_CATEGORIES.map((slug, idx) => ({
          slug,
          name: slug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          isActive: true,
          sortOrder: idx
        }));

    res.json({
      success: true,
      data: {
        categories: effectiveCategories,
        settings: {
          teamMatchingEnabled: settings?.teamMatchingEnabled ?? true,
          maintenanceBanner: settings?.maintenanceBanner ?? ''
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

