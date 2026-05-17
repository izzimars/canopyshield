import { Router } from 'express';
import { usersController } from './controller';
import { requireAuth } from '../../shared/middlewares';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';

const router = Router();

router.get('/users/me', requireAuth, WatchAsyncController(usersController.me));
router.put('/users/me/alerts', requireAuth, WatchAsyncController(usersController.updateAlerts));

export default router;
