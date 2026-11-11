import { z } from 'zod';
import { PARTICIPATION_STATUSES } from '../config/constants.js';

const optionalHttpUrl = z
  .string()
  .trim()
  .max(400)
  .refine((v) => !v || /^https?:\/\/.+/i.test(v), 'URL must start with http:// or https://')
  .optional();

export const createParticipationSchema = z.object({
  status: z.enum(PARTICIPATION_STATUSES).default('interested'),
  registrationUrl: optionalHttpUrl,
  personalNotes: z.string().trim().max(2000).optional(),
  preparationChecklist: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(200),
        completed: z.boolean().default(false)
      })
    )
    .max(30)
    .optional()
});

export const updateParticipationSchema = z.object({
  status: z.enum(PARTICIPATION_STATUSES).optional(),
  registrationUrl: optionalHttpUrl,
  outcome: z.string().trim().max(200).optional(),
  evidenceUrl: optionalHttpUrl,
  personalNotes: z.string().trim().max(2000).optional(),
  preparationChecklist: z
    .array(
      z.object({
        _id: z.string().optional(),
        text: z.string().trim().min(1).max(200),
        completed: z.boolean().default(false)
      })
    )
    .max(30)
    .optional()
});

