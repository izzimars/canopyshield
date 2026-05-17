import { Router } from 'express';
import { requireAuth, validate } from '../../shared/middlewares';
import pendingSchool from '../../shared/middlewares/school';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { schoolController } from './controller';
import { idParamSchema, riskHistorySchema, schoolBodySchema } from './validator';

const router = Router();

// 1. Static routes (no parameters)
router.get('/schools', requireAuth, WatchAsyncController(schoolController.getAllSchools.bind(schoolController)));
router.post('/schools', requireAuth, validate(schoolBodySchema), WatchAsyncController(schoolController.createSchool.bind(schoolController)));

// 2. Leaderboard static routes (these must come before any /schools/:id/...)
router.get('/schools/leaderboard/risk', requireAuth, WatchAsyncController(schoolController.getRiskLeaderboard.bind(schoolController)));
router.get('/schools/leaderboard/trees', requireAuth, WatchAsyncController(schoolController.getTreesLeaderboard.bind(schoolController)));

// 3. Dynamic routes (with :id parameter)
router.get('/schools/:id/risk', requireAuth, validate(idParamSchema), pendingSchool(), WatchAsyncController(schoolController.getSchoolRisk.bind(schoolController)));
router.get('/schools/:id/risk/history', requireAuth, validate(riskHistorySchema), pendingSchool(), WatchAsyncController(schoolController.getSchoolRiskHistory.bind(schoolController)));
router.get('/schools/:id/prediction', requireAuth, validate(idParamSchema), pendingSchool(), WatchAsyncController(schoolController.getSchoolPrediction.bind(schoolController)));
router.get('/schools/:id/trees', requireAuth, validate(idParamSchema), pendingSchool(), WatchAsyncController(schoolController.getSchoolTrees.bind(schoolController)));

export default router;
