import { Router } from 'express';
import { validate, rateLimit } from '../../shared/middlewares/index';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendOtpSchema,
} from './validator';
import AuthMiddleware from '../../shared/middlewares/auth';
import { authController } from './controller';
import { AUTH_ROUTES, RATE_LIMITS } from '../../shared/utils/const';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';

const router = Router();

// Rate limiting key generators
const emailRateLimitKey = (req: any) => `ratelimit:auth:email:${req.body?.email || req.ip}`;
const ipRateLimitKey = (req: any) => `ratelimit:auth:ip:${req.ip}`;

/**
 * POST /api/v1/auth/register
 */
router.post(
  AUTH_ROUTES.REGISTER,
  // rateLimit(RATE_LIMITS.REGISTER.attempts, RATE_LIMITS.REGISTER.windowMs, emailRateLimitKey),
  validate(registerSchema),
  WatchAsyncController(authController.register.bind(authController))
);

/**
 * POST /api/v1/auth/login
 */
router.post(
  AUTH_ROUTES.LOGIN,
  // rateLimit(RATE_LIMITS.LOGIN.attempts, RATE_LIMITS.LOGIN.windowMs, emailRateLimitKey),
  validate(loginSchema),
  WatchAsyncController(authController.login.bind(authController))
);

/**
 * POST /api/v1/auth/refresh
 */
router.post(
  AUTH_ROUTES.REFRESH,
  validate(refreshTokenSchema),
  AuthMiddleware('refresh'),
  WatchAsyncController(authController.refresh.bind(authController))
);

/**
 * POST /api/v1/auth/logout
 */
router.post(
  AUTH_ROUTES.LOGOUT,
  WatchAsyncController(authController.logout.bind(authController))
);

/**
 * POST /api/v1/auth/forgot-password
 */
router.post(
  AUTH_ROUTES.FORGOT_PASSWORD,
  rateLimit(RATE_LIMITS.FORGOT_PASSWORD.attempts, RATE_LIMITS.FORGOT_PASSWORD.windowMs, emailRateLimitKey),
  validate(forgotPasswordSchema),
  WatchAsyncController(authController.forgotPassword.bind(authController))
);

/**
 * POST /api/v1/auth/reset-password
 */
router.post(
  AUTH_ROUTES.RESET_PASSWORD,
  AuthMiddleware('forgot-password'),
  validate(resetPasswordSchema),
  WatchAsyncController(authController.resetPassword.bind(authController))
);

/**
 * GET /api/v1/auth/verify-otp
 */
router.get(
  AUTH_ROUTES.VERIFY_OTP,
  // rateLimit(RATE_LIMITS.VERIFY_OTP.attempts, RATE_LIMITS.VERIFY_OTP.windowMs, ipRateLimitKey),
  validate(verifyOtpSchema),
  WatchAsyncController(authController.verifyOtp.bind(authController))
);

/**
 * POST /api/v1/auth/resend-otp
 */
router.post(
  AUTH_ROUTES.RESEND_OTP,
  // rateLimit(RATE_LIMITS.RESEND_OTP.attempts, RATE_LIMITS.RESEND_OTP.windowMs, emailRateLimitKey),
  validate(resendOtpSchema),
  WatchAsyncController(authController.resendOtp.bind(authController))
);

export default router;
