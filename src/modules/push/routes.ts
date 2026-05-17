import { Router } from 'express';
import { requireAuth, validate } from '../../shared/middlewares';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { pushController } from './controller';
import { subscribeSchema, unsubscribeSchema } from './validator';

const router = Router();

router.post('/push/subscribe', requireAuth, validate(subscribeSchema), WatchAsyncController(pushController.subscribe.bind(pushController)));
router.post('/push/unsubscribe', requireAuth, validate(unsubscribeSchema), WatchAsyncController(pushController.unsubscribe.bind(pushController)));

export default router;
