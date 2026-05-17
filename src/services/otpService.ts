import { authRepository } from '../modules/authentication/repositories';
import { InternalServerErrorException } from '../shared/errors';
import { logger } from '../config/logger';
import { TOKEN_EXPIRY } from '../shared/utils/const';
import hashingService from './hashing/hashing.service';

/**
 * Service for OTP (One-Time Password) generation and verification
 */
export class OtpService {

  /**
   * Create and store hashed OTP for a user
   */
  async saveOtp(userId: string, type: string): Promise<string> {
    const code = hashingService.generateTOTP(userId);
    const hashedCode = await hashingService.hash(code);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.OTP_SECONDS * 1000);
    const savedOtp = await authRepository.storeOtp(userId, hashedCode, type, expiresAt);
    if (!savedOtp) {
      logger.error('Failed to save OTP for user:', userId);
      throw new InternalServerErrorException('Failed to save OTP');
    }
    logger.info(`OTP generated for user ${userId} (${type})`);
    return code;
  }

  /**
   * Verify OTP code for a user by comparing with hashed version
   */
  async verifyOtp(userId: string, code: string, type: string): Promise<boolean> {
    const otpRecord = await authRepository.findLatestOtpByUserAndType(userId, type);

      if (!otpRecord) {
        logger.warn(`No active OTP found for user ${userId}`);
        return false;
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        logger.warn(`OTP expired for user ${userId}`);
        return false;
      }

      // Verify code by comparing with hashed version
      const isValid = await hashingService.compare(code, otpRecord.code);
      
      if (!isValid) {
        logger.warn(`Incorrect OTP code for user ${userId}`);
        return false;
      }

      // Mark as consumed
      await authRepository.markConsumed(otpRecord.otp_uuid);
      
      return true;
  }
}

export const otpService = new OtpService();
