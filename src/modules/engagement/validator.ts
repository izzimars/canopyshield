import { z } from 'zod';

export const createQuizSchema = z.object({
  body: z.object({
    questionText: z.string().min(3),
    options: z.array(z.any()).min(2),
    correctOptionIndex: z.number().int().nonnegative(),
    topicTag: z.string().optional(),
  }),
});

export const quizAnswerSchema = z.object({
  body: z.object({
    quizId: z.string().min(1),
    selectedOption: z.number().int().nonnegative(),
  }),
});

export const donateSchema = z.object({
  body: z.object({
    schoolId: z.string().min(1),
    pointsToDonate: z.number().int().positive(),
  }),
});
