import { z } from 'zod';
import {
  ACADEMIC_DISCIPLINES,
  DEGREE_LEVELS,
  EVENT_MODES,
  EXPERIENCE_LEVELS,
  OPPORTUNITY_CATEGORIES
} from '../config/constants.js';

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (val) => !val || /^https?:\/\/.+/i.test(val),
    'URL must start with http:// or https://'
  )
  .optional()
  .default('');

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  studentProfile: z
    .object({
      collegeName: z.string().trim().max(160).optional(),
      course: z.string().trim().max(120).optional(),
      discipline: z.enum([...ACADEMIC_DISCIPLINES, '']).optional(),
      degreeLevel: z.enum([...DEGREE_LEVELS, '']).optional(),
      currentYear: z.coerce.number().int().min(1).max(7).nullable().optional(),
      age: z.coerce.number().int().min(15).max(60).nullable().optional(),
      state: z.string().trim().max(80).optional(),
      city: z.string().trim().max(80).optional(),
      skills: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
      interests: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
      experienceLevel: z.enum([...EXPERIENCE_LEVELS, '']).optional(),
      preferredEventModes: z.array(z.enum(EVENT_MODES)).max(3).optional(),
      preferredCategories: z.array(z.enum(OPPORTUNITY_CATEGORIES)).max(10).optional(),
      availabilityPreferences: z.enum(['weekdays', 'weekends', 'flexible', '']).optional()
    })
    .optional(),
  organizerProfile: z
    .object({
      organizationName: z.string().trim().max(160).optional(),
      organizationType: z
        .enum(['college-club', 'university', 'company', 'nonprofit', 'community', ''])
        .optional(),
      websiteUrl: optionalUrl,
      description: z.string().trim().max(1000).optional()
    })
    .optional(),
  notificationPreferences: z
    .object({
      inAppReminders: z.boolean().optional(),
      emailReminders: z.boolean().optional(),
      reminderDaysBefore: z.array(z.coerce.number().int().min(1).max(30)).max(5).optional(),
      teamUpdates: z.boolean().optional()
    })
    .optional()
});

