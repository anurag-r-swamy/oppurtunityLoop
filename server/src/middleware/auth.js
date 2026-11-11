import crypto from 'crypto';
import { env } from '../config/env.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { AppError } from './errorHandler.js';
import { SESSION_COOKIE_NAME } from './csrf.js';

export function hashSessionToken(rawToken) {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(rawToken).digest('hex');
}

export async function createSession(userId, userAgent = '') {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    userId,
    tokenHash,
    userAgent: String(userAgent).slice(0, 250),
    expiresAt
  });

  return { rawToken, session };
}

export function setSessionCookie(res, rawToken) {
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
  });
}

async function resolveSessionUser(req) {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);
  const session = await Session.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }).lean();

  if (!session) {
    return null;
  }

  const user = await User.findById(session.userId).select('-passwordHash').lean();
  if (!user || user.accountStatus !== 'active') {
    return null;
  }

  return { user, sessionId: session._id, tokenHash };
}

export async function authenticate(req, _res, next) {
  try {
    const resolved = await resolveSessionUser(req);
    if (!resolved) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required. Please log in.'));
    }
    req.user = resolved.user;
    req.sessionId = resolved.sessionId;
    req.sessionTokenHash = resolved.tokenHash;
    return next();
  } catch (err) {
    return next(err);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const resolved = await resolveSessionUser(req);
    if (resolved) {
      req.user = resolved.user;
      req.sessionId = resolved.sessionId;
    } else {
      req.user = null;
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.')
      );
    }
    return next();
  };
}

