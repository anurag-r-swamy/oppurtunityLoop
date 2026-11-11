import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

export const CSRF_COOKIE_NAME = 'ol_csrf';
export const SESSION_COOKIE_NAME = 'ol_session';

export function issueCsrfCookie(req, res) {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token || typeof token !== 'string' || token.length < 16) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
    });
  }
  return token;
}

export function verifyCsrf(req, _res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const hasSessionCookie = Boolean(req.cookies?.[SESSION_COOKIE_NAME]);
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.headers['x-csrf-token'];

  // Enforce double-submit CSRF check whenever a session cookie or csrf cookie is active
  if (hasSessionCookie || csrfCookie) {
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return next(
        new AppError(403, 'CSRF_INVALID', 'Invalid or missing CSRF token. Refresh and retry.')
      );
    }
  }

  return next();
}

