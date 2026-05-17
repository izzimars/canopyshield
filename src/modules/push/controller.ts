import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import ResponseHelper from '../../shared/utils/response';
import { pushRepository } from './repositories';
import { SubscribeDto, UnsubscribeDto } from './dto';
import { logger } from '../../config/logger';

export class PushController {
  async subscribe(req: AuthRequest, res: Response) {
    logger.info('push::controller::subscribe');
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(ResponseHelper.error('AUTH_MISSING', 'User not authenticated'));
    }

    const payload = new SubscribeDto(req.body);
    await pushRepository.upsertSubscription(userId, payload.endpoint, payload.keys.p256dh, payload.keys.auth);
    return res.json({ success: true });
  }

  async unsubscribe(req: AuthRequest, res: Response) {
    logger.info('push::controller::unsubscribe');
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(ResponseHelper.error('AUTH_MISSING', 'User not authenticated'));
    }

    const payload = new UnsubscribeDto(req.body);
    await pushRepository.deleteByUserAndEndpoint(userId, payload.endpoint);
    return res.json({ success: true });
  }
}

export const pushController = new PushController();
