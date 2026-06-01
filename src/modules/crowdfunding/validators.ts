import { z } from 'zod';

export const TreeContributionRequestSchema = z.object({
  body: z.object({
    idempotencyKey: z.string().uuid('Must be a valid UUID (v4)'),
    schoolId: z.string().min(1, 'schoolId is required'),
    amount: z.number().int().positive('amount must be a positive integer').max(1000000, 'Amount too high'),
  }),
});

export const PaginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10)
  }),
});

export type PaginationParams = z.infer<typeof PaginationSchema>['query'];
export type TreeContributionRequest = z.infer<typeof TreeContributionRequestSchema>['body'];
