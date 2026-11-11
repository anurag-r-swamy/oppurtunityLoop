import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must include at least one letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  // Strictly restrict public registration to student or organizer — never admin
  role: z.enum(['student', 'organizer']).default('student'),
  organizationName: z.string().trim().max(160).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required').max(128)
});

