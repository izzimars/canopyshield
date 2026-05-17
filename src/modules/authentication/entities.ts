import { BaseEntity } from '../../shared/utils/base-entity.js';

/**
 * User entity - represents a user record in the database
 */
export class UserEntity extends BaseEntity<UserEntity> {
  id!: string;
  user_uuid!: string;
  email!: string;
  username?: string;
  hashed_password!: string;
  is_verified!: boolean;
  school_id?: string;
  role!: 'user' | 'admin';
  created_at!: string;
  updated_at!: string;
  badge_id?: string;
  badge_name?: string;
}

/**
 * OTP code entity
 */
export class OtpCodeEntity extends BaseEntity<OtpCodeEntity> {
  id!: string;
  otp_uuid!: string;
  user_id!: string;
  code!: string;
  type!: 'verification' | 'reset';
  expires_at!: string;
  consumed!: boolean;
  created_at!: string;
}

/**
 * Password reset token entity
 */
export class PasswordResetTokenEntity extends BaseEntity<PasswordResetTokenEntity> {
  id!: string;
  user_id!: string;
  token_hash!: string;
  expires_at!: string;
  consumed!: boolean;
  created_at!: string;
}

/**
 * User response DTO - what we return to clients
 */
export class UserResponseEntity extends BaseEntity<UserResponseEntity> {
  user_uuid!: string;
  email!: string;
  role!: string;
  is_verified!: boolean;
  created_at!: string;
}

/**
 * Auth response entity - tokens returned after login
 */
export class AuthResponseEntity extends BaseEntity<AuthResponseEntity> {
  accessToken!: string;
  expiresIn!: string;
  refreshToken?: string;
  user?: UserResponseEntity;
}
