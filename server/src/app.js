import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { sanitizeRequest } from './middleware/sanitize.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { verifyCsrf } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import opportunityRoutes from './routes/opportunity.routes.js';
import bookmarkRoutes from './routes/bookmark.routes.js';
import participationRoutes from './routes/participation.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import teamRequestRoutes from './routes/teamRequest.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import reportRoutes from './routes/report.routes.js';
import adminRoutes from './routes/admin.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeRequest);

  app.use('/api/v1', apiLimiter);
  app.use('/api/v1', verifyCsrf);

  app.use('/api/v1', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/opportunities', opportunityRoutes);
  app.use('/api/v1', bookmarkRoutes);
  app.use('/api/v1', participationRoutes);
  app.use('/api/v1/recommendations', recommendationRoutes);
  app.use('/api/v1/team-requests', teamRequestRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/organizer', organizerRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

