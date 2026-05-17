import { Response } from 'express';
import { userServices } from './service';
import { AuthRequest } from '../../shared/types';
import { logger } from '../../config/logger';

export class UsersController {
  async me(req: AuthRequest, res: Response) {
    logger.info('users::controller::me');
    const userId = req.user?.id ?? req.user?.uuid ?? req.user?.user_uuid ?? req.claim?.user_uuid ?? req.claim?.id;
    const profile = await userServices.getFullProfile(String(userId));
    if (!profile) return res.status(404).json({ message: 'User not found' });
    return res.json(profile);
  }

  async updateAlerts(req: AuthRequest, res: Response) {
    logger.info('users::controller::updateAlerts');
    const userId = req.user?.id ?? req.user?.uuid ?? req.user?.user_uuid ?? req.claim?.user_uuid ?? req.claim?.id;
    const { risk_threshold, channels, frequency } = req.body;
    const updated = await userServices.updateAlertPreferences(String(userId), risk_threshold, channels, frequency);
    return res.json({ message: 'updated', alertPreferences: updated });
  }
}

export const usersController = new UsersController();