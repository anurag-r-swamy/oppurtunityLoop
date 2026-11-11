import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import {
  authenticate,
  clearSessionCookie,
  createSession,
  hashSessionToken,
  setSessionCookie
} from '../middleware/auth.js';
import { issueCsrfCookie, SESSION_COOKIE_NAME } from '../middleware/csrf.js';
import { AppError } from '../middleware/errorHandler.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.validators.js';

const router = express.Router();

function sanitizeUser(userDoc) {
  const obj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  delete obj.passwordHash;
  return obj;
}

router.get('/csrf-token', (req, res) => {
  const token = issueCsrfCookie(req, res);
  res.json({ success: true, data: { csrfToken: token } });
});

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { name, email, password, role, organizationName } = req.body;

      const existing = await User.findOne({ email }).lean();
      if (existing) {
        return next(new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists.'));
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const userData = {
        name,
        email,
        passwordHash,
        role,
        accountStatus: 'active'
      };

      if (role === 'organizer' && organizationName) {
        userData.organizerProfile = { organizationName };
      }

      const user = await User.create(userData);
      const { rawToken } = await createSession(user._id, req.headers['user-agent'] || '');
      setSessionCookie(res, rawToken);
      issueCsrfCookie(req, res);

      return res.status(201).json({
        success: true,
        data: {
          user: sanitizeUser(user)
        }
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post('/login', authLimiter, validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return next(new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.'));
    }

    if (user.accountStatus !== 'active') {
      return next(
        new AppError(403, 'ACCOUNT_SUSPENDED', 'Your account is currently suspended.')
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.'));
    }

    const { rawToken } = await createSession(user._id, req.headers['user-agent'] || '');
    setSessionCookie(res, rawToken);
    issueCsrfCookie(req, res);

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (rawToken) {
      const tokenHash = hashSessionToken(rawToken);
      await Session.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }
    clearSessionCookie(res);
    return res.json({
      success: true,
      data: { message: 'Logged out successfully.' }
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', authenticate, (req, res) => {
  issueCsrfCookie(req, res);
  res.json({
    success: true,
    data: {
      user: sanitizeUser(req.user)
    }
  });
});

export default router;

