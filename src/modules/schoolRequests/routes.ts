import { Router } from 'express';
import { schoolRequestController } from './controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';

const router = Router();

// Admin endpoints
router.get('/school-requests', requireAuth, requireRole('admin'), WatchAsyncController(schoolRequestController.listPending.bind(schoolRequestController)));
router.post('/school-requests/:id/status', requireAuth, requireRole('admin'), WatchAsyncController(schoolRequestController.updateRequest.bind(schoolRequestController)));

export default router;
