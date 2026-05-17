import { BaseEntity } from '../../shared/utils/base-entity';

/**
 * Register request DTO
 */
export class RegisterDto extends BaseEntity<RegisterDto> {
  email!: string;
  password!: string;
  schoolId?: string;
  username!: string;
}

/**
 * Login request DTO
 */
export class LoginDto extends BaseEntity<LoginDto> {
  email!: string;
  password!: string;
}

/**
 * Verify OTP request DTO
 */
export class VerifyOtpDto extends BaseEntity<VerifyOtpDto> {
  email!: string;
  code!: string;
  type!: 'verification' | 'forgot-password' | 'reset-password';
}

/**
 * Refresh token request DTO
 */
export class RefreshTokenDto extends BaseEntity<RefreshTokenDto> {
  refreshToken!: string;
}

/**
 * Forgot password request DTO
 */
export class ForgotPasswordDto extends BaseEntity<ForgotPasswordDto> {
  email!: string;
}

/**
 * Reset password request DTO
 */
export class ResetPasswordDto extends BaseEntity<ResetPasswordDto> {
  newPassword!: string;
}

/**
 * Resend OTP request DTO
 */
export class ResendOtpDto extends BaseEntity<ResendOtpDto> {
  email!: string;
  type!: string;
}

/**
 * Auth response DTO
 */
export class AuthResponseDto extends BaseEntity<AuthResponseDto> {
  success!: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: string;
    userId?: string;
    user?: {
      id: string;
      email: string;
      role: string;
      isVerified: boolean;
    };
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
