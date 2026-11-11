import { z } from 'zod';
import {
  ACADEMIC_DISCIPLINES,
  DEGREE_LEVELS,
  EVENT_MODES,
  OPPORTUNITY_CATEGORIES,
  VERIFICATION_STATUSES
} from '../config/constants.js';

const httpUrlSchema = z
  .string()
  .trim()
  .min(8)
  .max(400)
  .refine((val) => /^https?:\/\/.+/i.test(val), 'URL must start with http:// or https://');

export const opportunityBodySchema = z.object({
  title: z.string().trim().min(4).max(180),
  shortDescription: z.string().trim().min(10).max(320),
  fullDescription: z.string().trim().min(20).max(6000),
  category: z.enum(OPPORTUNITY_CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  organizerName: z.string().trim().min(2).max(160).optional(),
  officialSourceUrl: httpUrlSchema,
  registrationUrl: httpUrlSchema,
  eventMode: z.enum(EVENT_MODES),
  location: z
    .object({
      state: z.string().trim().max(80).default('All India'),
      city: z.string().trim().max(80).default(''),
      venue: z.string().trim().max(200).default('')
    })
    .default({ state: 'All India', city: '', venue: '' }),
  eligibilityRules: z
    .object({
      allowedDisciplines: z.array(z.enum(ACADEMIC_DISCIPLINES)).default([]),
      allowedDegreeLevels: z.array(z.enum(DEGREE_LEVELS)).default([]),
      allowedCourses: z.array(z.string().trim().max(80)).default([]),
      allowedYears: z.array(z.coerce.number().int().min(1).max(7)).default([]),
      allowedStates: z.array(z.string().trim().max(80)).default([]),
      minAge: z.coerce.number().int().min(14).max(60).nullable().optional(),
      maxAge: z.coerce.number().int().min(14).max(60).nullable().optional(),
      openToAllDisciplines: z.boolean().default(false),
      notes: z.string().trim().max(500).default('')
    })
    .default({}),
  feeAmount: z.coerce.number().min(0).max(1000000).default(0),
  feeCurrency: z.string().trim().max(10).default('INR'),
  deadline: z.coerce.date(),
  eventStartDate: z.coerce.date(),
  eventEndDate: z.coerce.date(),
  teamSize: z
    .object({
      min: z.coerce.number().int().min(1).max(20).default(1),
      max: z.coerce.number().int().min(1).max(20).default(1)
    })
    .default({ min: 1, max: 1 }),
  requiredSkills: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  beginnerFriendly: z.boolean().default(false),
  defaultChecklist: z.array(z.string().trim().min(1).max(200)).max(15).default([])
});

export const opportunityPatchSchema = opportunityBodySchema.partial();

export const opportunityQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.enum(OPPORTUNITY_CATEGORIES).optional(),
  mode: z.enum(EVENT_MODES).optional(),
  feeType: z.enum(['free', 'paid']).optional(),
  state: z.string().trim().max(80).optional(),
  degreeLevel: z.enum(DEGREE_LEVELS).optional(),
  discipline: z.enum(ACADEMIC_DISCIPLINES).optional(),
  course: z.string().trim().max(80).optional(),
  year: z.coerce.number().int().min(1).max(7).optional(),
  deadlineBefore: z.coerce.date().optional(),
  beginnerFriendly: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  includeExpired: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  sort: z.enum(['deadline', 'newest', 'relevance']).default('deadline'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

