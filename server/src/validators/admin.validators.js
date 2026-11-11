import { z } from 'zod';
import { REPORT_REASONS, REPORT_STATUSES } from '../config/constants.js';

export const createReportSchema = z.object({
  opportunityId: z.string().trim().min(12),
  reason: z.enum(REPORT_REASONS),
  description: z.string().trim().min(10).max(1000)
});

export const reviewReportSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  resolutionNote: z.string().trim().max(500).default('')
});

export const rejectOpportunitySchema = z.object({
  reason: z.string().trim().min(5).max(500),
  verificationStatus: z.enum(['rejected', 'needs_review']).default('rejected')
});

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain lowercase letters, numbers, and hyphens only'),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(''),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0)
});

export const platformSettingsSchema = z.object({
  teamMatchingEnabled: z.boolean().optional(),
  requireAdminVerification: z.boolean().optional(),
  defaultReminderDays: z.array(z.coerce.number().int().min(1).max(30)).max(5).optional(),
  maintenanceBanner: z.string().trim().max(300).optional()
});

