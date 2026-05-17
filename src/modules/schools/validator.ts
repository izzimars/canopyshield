import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'School id is required'),
  }),
});

export const riskHistorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'School id is required'),
  }),
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).optional(),
  }),
});

export const schoolBodySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'School name is required'),
    location: z.string().min(1, 'School location is required'),
    treeCount: z.number()
      .int('Tree count must be an integer')
      .min(0, 'Tree count cannot be negative')
      .optional(),
    lat: z.number()
      .min(-90, 'Latitude must be a number between -90 and 90')
      .max(90, 'Latitude must be a number between -90 and 90')
      .finite('Latitude must be a finite number')
      .optional(),
    lng: z.number()
      .min(-180, 'Longitude must be a number between -180 and 180')
      .max(180, 'Longitude must be a number between -180 and 180')
      .finite('Longitude must be a finite number')
      .optional(),
  }),
});

export type RiskHistoryQueryType = z.infer<typeof riskHistorySchema>['query'];
