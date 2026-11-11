import { z } from 'zod';
import { EXPERIENCE_LEVELS } from '../config/constants.js';

export const createTeamRequestSchema = z.object({
  opportunityId: z.string().trim().min(12),
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().min(10).max(1000),
  requiredSkills: z.array(z.string().trim().min(1).max(50)).max(15).default([]),
  creatorSkills: z.array(z.string().trim().min(1).max(50)).max(15).default([]),
  desiredExperienceLevel: z.enum([...EXPERIENCE_LEVELS, 'any']).default('any'),
  maximumMembers: z.coerce.number().int().min(2).max(15).default(4)
});

export const updateTeamRequestSchema = z.object({
  title: z.string().trim().min(4).max(140).optional(),
  description: z.string().trim().min(10).max(1000).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(50)).max(15).optional(),
  desiredExperienceLevel: z.enum([...EXPERIENCE_LEVELS, 'any']).optional(),
  maximumMembers: z.coerce.number().int().min(2).max(15).optional(),
  requestStatus: z.enum(['open', 'closed']).optional()
});

export const teamInviteOrJoinSchema = z.object({
  targetUserId: z.string().trim().min(12).optional(),
  message: z.string().trim().max(400).default(''),
  skillsOffered: z.array(z.string().trim().min(1).max(50)).max(15).default([])
});

export const teamRespondSchema = z.object({
  requestId: z.string().trim().min(12),
  decision: z.enum(['accepted', 'rejected', 'withdrawn'])
});

