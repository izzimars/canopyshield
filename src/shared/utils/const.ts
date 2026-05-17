/**
 * Authentication route constants
 */
export const BASE_AUTH_ROUTE = '/auth';

const authRoute = (path = '') => `${BASE_AUTH_ROUTE}${path}`;

export const AUTH_ROUTES = {
  REGISTER: authRoute('/register'),
  LOGIN: authRoute('/login'),
  REFRESH: authRoute('/refresh'),
  LOGOUT: authRoute('/logout'),
  VERIFY_OTP: authRoute('/verify-otp'),
  RESEND_OTP: authRoute('/resend-otp'),
  FORGOT_PASSWORD: authRoute('/forgot-password'),
  RESET_PASSWORD: authRoute('/reset-password'),
};

/**
 * Authentication error codes
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  NOT_VERIFIED: 'AUTH_NOT_VERIFIED',
  EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  INVALID_OTP: 'AUTH_INVALID_OTP',
  INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  TOKEN_REVOKED: 'AUTH_TOKEN_REVOKED',
  MISSING_TOKEN: 'AUTH_MISSING_TOKEN',
  INSUFFICIENT_PERMISSION: 'AUTH_INSUFFICIENT_PERMISSION',
  RATE_LIMITED: 'RATE_LIMITED',
};

/**
 * Token expiration times
 */
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '15m',
  ACCESS_TOKEN_SECONDS: 15 * 60,
  REFRESH_TOKEN_SECONDS: 30 * 24 * 60 * 60, // 30 days
  OTP_SECONDS: 15 * 60, // 15 minutes
  PASSWORD_RESET_TOKEN_SECONDS: 60 * 60, // 1 hour
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  REGISTER: { attempts: 5, windowMs: 15 * 60 * 1000 },
  LOGIN: { attempts: 5, windowMs: 15 * 60 * 1000 },
  FORGOT_PASSWORD: { attempts: 3, windowMs: 30 * 60 * 1000 },
  RESEND_OTP: { attempts: 3, windowMs: 30 * 60 * 1000 },
  VERIFY_OTP: { attempts: 10, windowMs: 15 * 60 * 1000 },
};

/**
 * Bcrypt configuration
 */
export const BCRYPT_COST = 12;
