import bcrypt from 'bcrypt';
import { authRepository } from './repositories';
import { BadException, NotFoundException, UnAuthorizedException, InternalServerErrorException } from '../../shared/errors';
import { otpService } from '../../services/otpService';
import MailService from '../../services//mailing/mailing.service';
import { logger } from '../../config/logger';
import { BCRYPT_COST, AUTH_ERROR_CODES } from '../../shared/utils/const';
import hashingService from '../../services/hashing/hashing.service';
import { TOKEN_EXPIRY } from '../../shared/utils/const';
import { UserEntity } from './entities';

/**
 * Main authentication service orchestrating the auth flow
 */

export interface AuthServices {
  register(email: string, password: string, schoolId?: string, username?: string): Promise<{ userId: string; otp: string } | BadException | InternalServerErrorException>;
  login(email: string, password: string): Promise<{ token: string; refreshToken: string; user: UserEntity, badgeName: string | null } | UnAuthorizedException>;
  forgotPassword(email: string): Promise<{ otp: string } | NotFoundException>;
  resetPassword(user: UserEntity, newPassword: string): Promise<{ token: string; refreshToken: string }>;
  verifyOtp(email: string, code: string, type: string): Promise<{ user: UserEntity; token: string; refreshToken: string } | UnAuthorizedException>;
  resendOtp(email: string, type: string): Promise<{ message: string; otp: string } | NotFoundException>;
  logout(userId: string, refreshTokenJti: string, accessTokenJti: string): Promise<void>;
}

export class AuthServiceImpl implements AuthServices {
  /**
   * Register a new user
   */
  async register(email: string, password: string, schoolId?: string, username?: string): Promise<{ userId: string; otp: string } | BadException> {
    logger.info('authentication::services::register');
    // Check if email already exists
    const existingUser = await authRepository.emailOrUsernameExists(email, username);

    if (existingUser) {
      return new BadException('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    // Create user
    const userId = await authRepository.createUser(email, passwordHash, schoolId, username);

    if (userId instanceof InternalServerErrorException) {
      return new InternalServerErrorException('Failed to create user');
    }

    // Generate and send OTP
    const otp = await otpService.saveOtp(userId, 'verification');
    await MailService('Welcome to CanopyShield', 'userValidationOTP', { email, otp, duration: TOKEN_EXPIRY.OTP_SECONDS / 60 });

    logger.info(`User registered: ${email}`);

    return { userId, otp };
  }

  /**
   * Login user and issue tokens
   */
  async login(email: string, password: string): Promise<{ token: string; refreshToken: string; user: any, badgeName: string | null } | UnAuthorizedException> {
    logger.info('authentication::services::login');
    // Find user
    const user = await authRepository.findByEmail(email);
    if (!user) {
      return new UnAuthorizedException(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Check if verified
    if (!user.is_verified) {
      return new UnAuthorizedException(AUTH_ERROR_CODES.NOT_VERIFIED);
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!passwordMatch) {
      return new UnAuthorizedException(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Create tokens
    const { token, refreshToken } = await hashingService.issueTokens({
    id: user.id,
    user_id: user.user_uuid,
    email: user.email,
    username: user.username,
    verified: user.is_verified,
    user_type: user.role
    }, 'access');

    logger.info(`User logged in: ${email}`);

    return {
      token,
      refreshToken,
      badgeName: user.badge_name ?? null,
      user: {
        id: user.user_uuid,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
      },
    };
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string): Promise<{ otp: string } | NotFoundException> {
    logger.info('authentication::services::forgotPassword');
    const user = await authRepository.findByEmail(email);

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return new NotFoundException('Email not found');
    }

    // Generate OTP and send email
    const otp = await otpService.saveOtp(user.user_uuid, 'forgot-password');
    await MailService('Forgot Password', 'forgotPassword', { email, otp, duration: TOKEN_EXPIRY.OTP_SECONDS / 60 });

    logger.info(`Password reset OTP sent to: ${email}`);
    return { otp };
  }

  /**
   * Reset password with token
   */
  async resetPassword(user: any, newPassword: string): Promise<{ token: string; refreshToken: string }> {
    logger.info('authentication::services::resetPassword');
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    // Update password
    await authRepository.updatePassword(user.user_uuid, passwordHash);

    logger.info(`Password reset for user: ${user.user_uuid}`);
    const { token, refreshToken } = await hashingService.issueTokens({
      id: user.id,
      user_id: user.user_uuid,
      email: user.email,
      username: user.username,
      verified: user.is_verified,
      user_type: user.role
    }, 'access');
    return { token, refreshToken };
  }

  /**
   * Verify OTP and mark user as verified
   */
  async verifyOtp(email: string, code: string, type: string): Promise<{ user: UserEntity; token: string; refreshToken: string } | UnAuthorizedException> {
    logger.info('authentication::services::verifyOtp');
    const user = await authRepository.findByEmail(email);
    if (!user) {
      return new UnAuthorizedException('User not found');
    }

    const isValid = await otpService.verifyOtp(user.user_uuid, code, type);
    if (!isValid) {
      return new UnAuthorizedException('Invalid OTP code');
    }

    // Mark user as verified
    await authRepository.markVerified(user.user_uuid);
    if (type === 'verification') {
      const { token, refreshToken } = await hashingService.issueTokens({
        id: user.id,
        user_id: user.user_uuid,
        email: user.email,
        username: user.username,
        verified: user.is_verified,
        user_type: user.role
      }, 'access');
      logger.info(`User verified: ${user.user_uuid}`);
      return { user, token, refreshToken };
    }
    else if (type === 'forgot-password' || type === 'reset-password') {
      const token = await hashingService.tempToken({
        id: user.id,
        user_id: user.user_uuid,
        email: user.email,
        username: user.username,
        verified: user.is_verified,
        user_type: user.role
      }, type === 'reset-password' ? 'reset-password' : 'forgot-password');
      logger.info(`OTP verified for password reset: ${user.user_uuid}`);
      return { user, token, refreshToken: '' };
    }
    
    return new UnAuthorizedException('Invalid OTP type');
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string, type: string): Promise<{ message: string; otp: string } | NotFoundException> {
    logger.info('authentication::services::resendOtp');
    const user = await authRepository.findByEmail(email);

    if (!user) {
      // Always return success for security
      return new NotFoundException('Email not found');
    }

    const otp_record = await authRepository.findLatestOtpByUser(user.user_uuid);

    if (otp_record == null) {
      return new NotFoundException('No OTP record found for user');
    }

    const otp = await otpService.saveOtp(user.user_uuid, type)

    MailService('Resend OTP', 'resendOtp', { email, otp });

    logger.info(`OTP resent to: ${email}`);
    return { message: 'New OTP sent to email', otp };
  }

  /**
   * Logout user - revoke tokens
   */
  async logout(_userId: string, _refreshTokenJti: string, _accessTokenJti: string): Promise<void> {
    logger.info('authentication::services::logout');
    // Placeholder implementation - can be extended with token revocation logic
    logger.info(`User logged out`);
  }
}

const authService = new AuthServiceImpl();
export default authService;
