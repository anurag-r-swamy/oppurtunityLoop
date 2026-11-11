import { ZodError } from 'zod';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`
    },
    requestId: req.id
  });
}

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred.';
  let details = err.details || null;

  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request data.';
    details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message
    }));
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Database validation failed.';
    details = Object.values(err.errors || {}).map((e) => ({
      path: e.path,
      message: e.message
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid identifier for ${err.path || 'resource'}.`;
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    const fields = Object.keys(err.keyPattern || {});
    message = fields.length
      ? `A record with this ${fields.join(', ')} already exists.`
      : 'Duplicate resource conflict.';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON request body.';
  }

  if (statusCode >= 500 && env.NODE_ENV !== 'test') {
    console.error(`[${req.id || 'no-req-id'}] Error:`, {
      code,
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  if (env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'An unexpected server error occurred. Please try again later.';
    details = null;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    },
    requestId: req.id
  });
}

