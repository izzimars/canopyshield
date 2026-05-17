import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { TOKEN_EXPIRY } from '../shared/utils/const.js';

/**
 * Service for JWT token creation and refresh token management
 */
export class TokenService {
  /**
   * Create a short-lived access token (JWT HS256)
   */
  createAccessToken(payload: { sub: string; email: string; role: string; jti: string }): string {
    try {
      const options: SignOptions = {
        expiresIn: '15m',
        algorithm: 'HS256',
      };

      const token = jwt.sign(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          jti: payload.jti,
        },
        env.JWT_ACCESS_SECRET as string,
        options
      );
      return token;
    } catch (error) {
      logger.error('Failed to create access token:', error);
      throw error;
    }
  }

  /**
   * Create a refresh token (random long string + metadata)
   * Returns both the token (to send to client) and a JTI (to store with hash in DB)
   */
  createRefreshToken(): { token: string; jti: string; expiresAt: Date } {
    const jti = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH_TOKEN_SECONDS * 1000);
    return { token, jti, expiresAt };
  }

  /**
   * Hash a token (bcrypt)
   */
  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 12);
  }

  /**
   * Verify a token against its hash
   */
  async verifyHashedToken(token: string, tokenHash: string): Promise<boolean> {
    return bcrypt.compare(token, tokenHash);
  }

  /**
   * Validate an access token JWT
   */
  validateAccessToken(token: string): { sub: string; email: string; role: string; jti: string } | null {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET as string, {
        algorithms: ['HS256'],
      }) as any;
      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        jti: decoded.jti,
      };
    } catch (error) {
      logger.debug('Access token validation failed:', error);
      return null;
    }
  }

  /**
   * Validate a refresh token JWT
   */
  validateRefreshToken(token: string): { sub: string; jti: string } | null {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET as string, {
        algorithms: ['HS256'],
      }) as any;
      return {
        sub: decoded.sub,
        jti: decoded.jti,
      };
    } catch (error) {
      logger.debug('Refresh token validation failed:', error);
      return null;
    }
  }

  /**
   * Get expiration time in seconds from JWT
   */
  getTokenExpiration(token: string): number {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded?.exp) {
        return decoded.exp - Math.floor(Date.now() / 1000);
      }
      return 0;
    } catch {
      return 0;
    }
  }
}

export const tokenService = new TokenService();
