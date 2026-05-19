import { z } from 'zod';

/**
 * Zod validation schemas for authentication endpoints
 */

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    schoolId: z.string().optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase(),
    password: z.string().min(1, 'Password required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase(),
    code: z.string().length(6, 'OTP must be 6 digits'),
    type: z.enum(['verification', 'forgot-password', 'reset-password']),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase(),
    type: z.enum(['verification', 'forgot-password', 'reset-password']),
  }),
});

// Export types for use in services
export type RegisterSchemaType = z.infer<typeof registerSchema>['body'];
export type LoginSchemaType = z.infer<typeof loginSchema>['body'];
export type VerifyOtpSchemaType = z.infer<typeof verifyOtpSchema>['query'];
export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>['body'];
export type ResendOtpSchemaType = z.infer<typeof resendOtpSchema>['body'];
