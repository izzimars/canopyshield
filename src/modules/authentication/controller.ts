import * as dtos from './dto';
import { StatusCodes } from 'http-status-codes';
import { Response } from 'express';
import RequestWithClaim, { AuthRequest } from '../../shared/types/index';
import authServices, { AuthServices } from './services';
import { NotFoundException, UnAuthorizedException, InternalServerErrorException, BadException,
  handleCustomSuccess, handleCustomError } from '../../shared/errors';
import { logger } from '../../config/logger';
import ResponseHelper from '../../shared/utils/response';
import hashingService from '../../services/hashing/hashing.service';

export class AuthController {
  /**
   * POST /auth/register
   * Register a new user and send verification email
   */
  constructor(
    private readonly authServices: AuthServices,
    // private readonly firebaseService: FirebaseService
  ) {}

  async register(req: any, res: Response) {
    logger.info('authentication::controller::register');
    const payload = new dtos.RegisterDto(req.body);
    const resp = await this.authServices.register(payload.email, payload.password, payload.schoolId, payload.username);

    if (resp instanceof BadException) {
      return handleCustomError(res, resp, StatusCodes.CONFLICT, 'USER_ALREADY_EXISTS');
    }

    if (resp instanceof InternalServerErrorException) {
      return handleCustomError(res, resp, StatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR');
    }

    const responseData: Record<string, unknown> = { userId: resp.userId };
    if (process.env.NODE_ENV === 'test') {
      responseData.otp = resp.otp;
    }

    return handleCustomSuccess(res, 'Verification email sent', StatusCodes.OK, responseData);
  }

  /**
   * POST /auth/login
   * Authenticate user and issue access + refresh tokens
   */
  async login(req: any, res: Response) {
    logger.info('authentication::controller::login');
    const payload = new dtos.LoginDto(req.body);

    const loginResult = await this.authServices.login(payload.email, payload.password);

    if (loginResult instanceof UnAuthorizedException) {
      return handleCustomError(res, loginResult, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    const { token, refreshToken, user, badgeName } = loginResult;

    return handleCustomSuccess(res, 'Login successful', StatusCodes.OK, { token, refreshToken, user, badgeName });
  }

  /**
   * POST /auth/refresh
   * Refresh access token (token rotation)
   * Note: This is a placeholder; full implementation requires token lookup
   */
  async refresh(req: any, res: Response) {
    logger.info('authentication::controller::refresh');
    const claimUser = req.claim?.user ?? req.claim;
    const { token, refreshToken } = await hashingService.issueTokens({
      id: claimUser.id,
      user_id: claimUser.user_uuid,
      email: claimUser.email,
      username: claimUser.username,
      verified: claimUser.is_verified,
      user_type: claimUser.role
    }, 'access');
    
    return handleCustomSuccess(res, 'Token refreshed', StatusCodes.OK, {
      token,
      refreshToken,
    });
  }

  /**
   * POST /auth/logout
   * Logout user and revoke tokens
   */
  async logout(req: AuthRequest, res: Response) {
    logger.info('authentication::controller::logout');
    try {
      if (!req.user) {
        return void res.status(401).json(
          ResponseHelper.error('AUTH_MISSING_TOKEN', 'Authorization required')
        );
      }

      const { refreshTokenJti } = req.body; // Should come from middleware/request

      // Revoke refresh and access tokens
      await this.authServices.logout(
        req.user.id,
        refreshTokenJti || 'unknown',
        req.user.jti
      );

      // Clear refresh cookie
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
      });

      return void res.status(200).json(ResponseHelper.success(null, 'Logged out successfully'));
    } catch (error: any) {
      logger.error('Logout error:', error);
      return void res.status(500).json(
        ResponseHelper.error('INTERNAL_ERROR', 'Logout failed')
      );
    }
  }

  /**
   * POST /auth/forgot-password
   * Initiate password reset flow
   */
  async forgotPassword(req: any, res: Response) {
      logger.info('authentication::controller::forgotPassword');
      const payload = new dtos.ForgotPasswordDto(req.body);

      const result = await this.authServices.forgotPassword(payload.email);

      if (result instanceof NotFoundException) {
        return handleCustomError(res, result, StatusCodes.NOT_FOUND, 'USER_NOT_FOUND');
      }

      const responseData: Record<string, unknown> = {};
      if (process.env.NODE_ENV === 'test') {
        responseData.otp = result.otp;
      }

      return handleCustomSuccess(res, 'Password reset email sent', StatusCodes.OK, responseData);
  }

  /**
   * POST /auth/reset-password
   * Reset password with OTP/token
   */
  async resetPassword(req: RequestWithClaim, res: Response) {
      logger.info('authentication::controller::resetPassword');
      const payload = new dtos.ResetPasswordDto(req.body);
      const user = req.claim?.user ?? req.claim;

      await this.authServices.resetPassword(user, payload.newPassword);
      return handleCustomSuccess(res, 'Password reset successful', StatusCodes.OK);
  }

  /**
   * GET /auth/verify-otp
   * Verify OTP code and mark user as verified
   */
  async verifyOtp(req: any, res: Response) {
      logger.info('authentication::controller::verifyOtp');
      const payload = new dtos.VerifyOtpDto(req.body);

      const resp = await this.authServices.verifyOtp(payload.email, payload.code, payload.type);
      if (resp instanceof UnAuthorizedException) {
        return handleCustomError(res, resp, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED');
      }

      const { user, token, refreshToken } = resp;
      return handleCustomSuccess(res, 'Email verified successfully', StatusCodes.OK, {
        user,
        token,
        refreshToken,
      });
  }

  /**
   * POST /auth/resend-otp
   * Resend verification OTP to email
   */
  async resendOtp(req: any, res: Response) {
      logger.info('authentication::controller::resendOtp');
      const payload = new dtos.ResendOtpDto(req.body);

      const result = await this.authServices.resendOtp(payload.email, payload.type);

      if (result instanceof NotFoundException) {
        return handleCustomError(res, result, StatusCodes.NOT_FOUND, 'USER_NOT_FOUND');
      }

      const responseData: Record<string, unknown> = {};
      if (process.env.NODE_ENV === 'test') {
        responseData.otp = result.otp;
      }

      return handleCustomSuccess(res, result.message, StatusCodes.OK, responseData);
  }
}

export const authController = new AuthController(authServices);

export default authController;
