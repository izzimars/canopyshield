import { usersRepository } from './repositories';
import { UserProfile } from '../../shared/types';
import { logger } from '../../config/logger';

export interface UserServices {
    getFullProfile(userUuid: string): Promise<UserProfile | null>;
    updateAlertPreferences(userUuid: string, riskThreshold?: number, channels?: string[], frequency?: string): Promise<{ risk_threshold: number, channels: string[], frequency: string }>;
}

export class UserServicesImpl implements UserServices {
    async getFullProfile(userUuid: string) {
        logger.info('users::services::getFullProfile');
        return await usersRepository.getFullProfile(userUuid);
    }

    async updateAlertPreferences(userUuid: string, riskThreshold?: number, channels?: string[], frequency?: string) {
        logger.info('users::services::updateAlertPreferences');
        return await usersRepository.updateAlertPreferences(userUuid, riskThreshold, channels, frequency);
    }
}

export const userServices = new UserServicesImpl();