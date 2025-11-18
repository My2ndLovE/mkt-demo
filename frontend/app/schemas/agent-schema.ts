import { z } from 'zod';

const USER_ROLES = ['PLAYER', 'AGENT'] as const;

/**
 * Create agent form validation schema
 */
export const createAgentSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),

  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),

  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),

  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),

  canCreateSubs: z.boolean().default(false),

  weeklyLimit: z
    .number()
    .min(100, 'Minimum weekly limit is $100')
    .max(1000000, 'Maximum weekly limit is $1,000,000')
    .int('Weekly limit must be a whole number'),
});

export type CreateAgentFormData = z.infer<typeof createAgentSchema>;

/**
 * Update agent limits schema
 */
export const updateLimitsSchema = z.object({
  weeklyLimit: z
    .number()
    .min(100, 'Minimum weekly limit is $100')
    .max(1000000, 'Maximum weekly limit is $1,000,000')
    .int('Weekly limit must be a whole number'),
});

export type UpdateLimitsFormData = z.infer<typeof updateLimitsSchema>;

/**
 * Update agent status schema
 */
export const updateAgentStatusSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateAgentStatusFormData = z.infer<typeof updateAgentStatusSchema>;
