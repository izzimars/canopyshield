import { Router } from 'express';
import { requireAuth, requireRole, validate } from '../../shared/middlewares';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { engagementController } from './controller';
import { createQuizSchema, quizAnswerSchema, donateSchema } from './validator';

const router = Router();

router.get('/quiz/today', requireAuth, WatchAsyncController(engagementController.getToday.bind(engagementController)));
router.post('/engagement/quiz', requireAuth, validate(quizAnswerSchema), WatchAsyncController(engagementController.postAnswer.bind(engagementController)));
router.post('/admin/quiz', requireAuth, requireRole('admin'), validate(createQuizSchema), WatchAsyncController(engagementController.createQuestion.bind(engagementController)));

router.post('/engagement/share', requireAuth, WatchAsyncController(engagementController.share.bind(engagementController)));
router.post('/engagement/donate', requireAuth, validate(donateSchema), WatchAsyncController(engagementController.donate.bind(engagementController)));

export default router;
