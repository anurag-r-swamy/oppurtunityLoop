import crypto from 'crypto';
import { env } from '../config/env.js';

export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  req.id = typeof incomingId === 'string' && incomingId.trim() ? incomingId.trim().slice(0, 64) : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const start = Date.now();
  res.on('finish', () => {
    if (env.NODE_ENV === 'test') return;
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration
      })
    );
  });

  next();
}

