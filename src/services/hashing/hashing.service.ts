import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken';
import { SignedData } from '../../shared/interfaces/index';
import { JwtAccessOptions, JwtRefreshOptions, JwtTempTokenOptions } from '../../config/env';
type jwtPayload = Jwt | JwtPayload | string;

export interface HashingService {
  genSalt(rounds: number): Promise<string>;
  generateVerificationHash(): string;
  generateTOTP(userId?: string): string;
  verify(token: string): jwtPayload | null;
  sign(payload: SignedData): Promise<string>;
  decode(token: string): any;
  hash(data: string, salt?: string): Promise<string>;
  compare(data: string, hash: string): Promise<boolean>;
  issueTokens(payload: SignedData, type: string): Promise<{ token: string; refreshToken: string }>;
  tempToken(payload: SignedData, type: string): Promise<string>;
}

export class HashingServiceImpl implements HashingService {
  private readonly cryptoSecret: string = env.CRYPTO_SECRET;
  private readonly timeStep: number = env.CRYPTO_TIME_STEP;
  private readonly otpLength: number = env.CRYPTO_OTP_LENGTH;
  private readonly hashAlgorithm: string = env.CRYPTO_HASH_ALGO;
  private readonly saltRound: number = env.SALT_ROUND ?? 12;
  private readonly JwtSigned = JwtAccessOptions; // Default signing options for JWTs
  private readonly jwtSecret = env.JWT_ACCESS_SECRET;
  private readonly accessSecret = env.JWT_ACCESS_SECRET;
  private readonly refreshSecret = env.JWT_REFRESH_SECRET;

  public async genSalt(rounds: number): Promise<string> {
    return bcrypt.genSalt(rounds);
  }

  public async hash(data: string, salt = bcrypt.genSaltSync(Number(this.saltRound))): Promise<string> {
    return bcrypt.hash(data, salt);
  }

  public async compare(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }

  public generateTOTP(userId?: string): string {
    const currentTime = Math.floor(Date.now() / 1000);
    const counter = Math.floor(currentTime / this.timeStep);

    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(counter, 4);

    // Include user ID in HMAC to make OTP user-specific
    let hmacData = counterBuffer;
    if (userId) {
      hmacData = Buffer.concat([counterBuffer, Buffer.from(userId, 'utf-8')]);
    }

    const hmac = crypto.createHmac(this.hashAlgorithm, this.cryptoSecret).update(hmacData).digest();

    const offset = hmac[hmac.length - 1] & 0x0f;

    const otpBytes = new Uint8Array(hmac.buffer, hmac.byteOffset + offset, 4);

    const otpValue =
      new DataView(otpBytes.buffer, otpBytes.byteOffset, otpBytes.byteLength).getUint32(0, false) %
      Math.pow(10, this.otpLength);

    return otpValue.toString().padStart(this.otpLength, '0');
  }

  public generateVerificationHash(): string {
    return uuidv4();
  }

  public verify(token: string): jwtPayload | null {
    try {
      return jwt.verify(token, this.accessSecret);
    } catch (accessError) {
      try {
        return jwt.verify(token, this.refreshSecret);
      } catch (refreshError) {
       return null; // or log both errors
      }
   }
  }

  public async sign(payload: SignedData,): Promise<string> {
    return jwt.sign(payload, this.jwtSecret, this.JwtSigned);
  }

async issueTokens(payload: SignedData, type: string) {
  const accessPayload = { ...payload, type };
  const refreshPayload = { ...payload, type: 'refresh' };
  const token = jwt.sign(accessPayload, this.accessSecret, JwtAccessOptions);
  const refreshToken = jwt.sign(refreshPayload, this.refreshSecret, JwtRefreshOptions);
  return { token, refreshToken };
}

async tempToken(payload: SignedData, type: string): Promise<string> {
  const tempPayload = { ...payload, type };
  return jwt.sign(tempPayload, this.jwtSecret, JwtTempTokenOptions);
}

  public decode(token: string) {
    return jwt.decode(token);
  }
}

const hashingService: HashingService = new HashingServiceImpl();

export default hashingService;
