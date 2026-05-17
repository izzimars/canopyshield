import { db } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { NotFoundException, InternalServerErrorException } from '../../shared/errors/index.js';
import authQueries from './query';
import { } from './entities';
import { UserEntity, OtpCodeEntity } from './entities.js';

/**
 * User repository - database operations for users
 */
export class AuthRepository {
  async createUser(email: string, passwordHash: string, schoolId?: string, username?: string): Promise<string | InternalServerErrorException> {
    logger.info('authentication::repository::createUser');
    const query = authQueries.createUser;
    const user = await db.one(query, [email, passwordHash, schoolId, username]);
    if (user) {
      return user.user_uuid;
    }
    return new InternalServerErrorException('Failed to create user');
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    logger.info('authentication::repository::findByEmail');
    const query = `
      SELECT u.id, u.user_uuid, u.email, u.hashed_password, u.is_verified, u.role, u.created_at, u.updated_at,
        b.id as badge_id, b.type as badge_name
      FROM users as u
      LEFT JOIN badges as b ON u.user_uuid = b.user_id
      WHERE lower(email) = lower($1)
    `;
    try {
      return await db.oneOrNone(query, [email]);
    } catch (error) {
      logger.error('Failed to find user by email:', error);
      throw error;
    }
  }

  async findByUuid(userUuid: string): Promise<UserEntity | null> {
    logger.info('authentication::repository::findByUuid');
    const query = `
      SELECT user_uuid, email, hashed_password, is_verified, role, created_at, updated_at
      FROM users
      WHERE user_uuid = $1
    `;
    try {
      return await db.oneOrNone(query, [userUuid]);
    } catch (error) {
      logger.error('Failed to find user by UUID:', error);
      throw error;
    }
  }

  async updatePassword(userUuid: string, newPasswordHash: string): Promise<UserEntity> {
    logger.info('authentication::repository::updatePassword');
    const query = `
      UPDATE users
      SET hashed_password = $1, updated_at = now()
      WHERE user_uuid = $2
      RETURNING id, user_uuid, email, hashed_password, is_verified, role, created_at, updated_at
    `;
    try {
      return await db.one(query, [newPasswordHash, userUuid]);
    } catch (error) {
      logger.error('Failed to update password:', error);
      throw error;
    }
  }

  async markVerified(userUuid: string): Promise<UserEntity> {
    logger.info('authentication::repository::markVerified');
    const query = `
      UPDATE users
      SET is_verified = true, updated_at = now()
      WHERE user_uuid = $1
      RETURNING id, user_uuid, email, hashed_password, is_verified, role, created_at, updated_at
    `;
    try {
      return await db.one(query, [userUuid]);
    } catch (error) {
      logger.error('Failed to mark user as verified:', error);
      throw error;
    }
  }

  async emailExists(email: string): Promise<boolean> {
    logger.info('authentication::repository::emailExists');
    const query = authQueries.emailExists;
    const user = await db.oneOrNone(query, [email]);

    return Boolean(user);
  }
  async storeOtp(userId: string, code: string, type: string, expiresAt: Date): Promise<OtpCodeEntity> {
    logger.info('authentication::repository::storeOtp');
    const query = authQueries.storeOtp;
    const storedOtp = await db.one(query, [userId, code, type, expiresAt]);
    if (!storedOtp) {
      throw new InternalServerErrorException('Failed to store OTP');
    }
    logger.info(`Storing OTP for user ${userId} (${type})`);
    return new OtpCodeEntity({
      id: storedOtp.id,
      user_id: storedOtp.user_id,
      code: storedOtp.code,
      type: storedOtp.type,
      expires_at: storedOtp.expires_at,
      consumed: storedOtp.consumed,
      created_at: storedOtp.created_at,
    });
  }

  async findLatestOtpByUser(userId: string): Promise<OtpCodeEntity | null> {
    logger.info('authentication::repository::findLatestOtpByUser');
    const query = authQueries.findLatestOtpByUser;
    const otp = await db.oneOrNone(query, [userId]);
    if (otp) {
      return new OtpCodeEntity({
        id: otp.id,
        user_id: otp.user_id,
        code: otp.code,
        type: otp.type,
        expires_at: otp.expires_at,
        consumed: otp.consumed,
        created_at: otp.created_at,
      });
    }
    return null;
  }

  async findLatestOtpByUserAndType(userId: string, type: string): Promise<OtpCodeEntity | null> {
    logger.info('authentication::repository::findLatestOtpByUserAndType');
    const query = authQueries.findLatestOtpByUserAndType;
    const otp = await db.oneOrNone(query, [userId, type]);
    if (otp) {
      return new OtpCodeEntity({
        id: otp.id,
        otp_uuid: otp.otp_uuid,
        user_id: otp.user_id,
        code: otp.code,
        type: otp.type,
        expires_at: otp.expires_at,
        consumed: otp.consumed,
        created_at: otp.created_at,
      });
    }
    return null;
  }

  async markConsumed(otpId: string): Promise<void | NotFoundException> {
    logger.info('authentication::repository::markConsumed');
    const query = authQueries.markOtpConsumed;
    const result = await db.result(query, [otpId]);
    if (result.rowCount === 0) {
      logger.warn(`No OTP record updated for ID ${otpId}`);
      return new NotFoundException('OTP record not found to mark as consumed');
    }
    logger.info(`OTP with ID ${otpId} marked as consumed`);
    return;
  }

  /**
   * Find all users in a school
   */
  async findBySchool(schoolId: string): Promise<UserEntity[] | null> {
    logger.info('authentication::repository::findBySchool');
    const query = `
      SELECT user_uuid, email, hashed_password, is_verified, role, created_at, updated_at
      FROM users
      WHERE school_id = $1
    `;
    try {
      return await db.manyOrNone(query, [schoolId]);
    } catch (error) {
      logger.error('Failed to find users by school:', error);
      throw error;
    }
  }
}


// Export singleton instances
export const authRepository = new AuthRepository();