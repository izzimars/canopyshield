import dotenv from 'dotenv';
import { z } from 'zod';
import { SignOptions } from 'jsonwebtoken';
import { JwtSignature } from '../shared/interfaces/index';

dotenv.config();

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
});

const envSpecificSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  OPENWEATHERMAP_API_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().min(1).default('mailto:admin@canopyshield.io'),
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  LOG_LEVEL: z.string().default('info'),
  CRYPTO_SECRET: z.string().min(16),
  CRYPTO_TIME_STEP: z.coerce.number().int().positive().default(30),
  CRYPTO_OTP_LENGTH: z.coerce.number().int().positive().default(6),
  CRYPTO_HASH_ALGO: z.string().default('sha1'),
  SALT_ROUND: z.coerce.number().int().positive().default(12),
});

type EnvSpecific = z.infer<typeof envSpecificSchema>;
type BaseEnv = z.infer<typeof baseSchema>;

export type AppEnv = BaseEnv & EnvSpecific;

function getEnvironmentPrefix(nodeEnv: string): string {
  switch (nodeEnv) {
    case 'test':
      return 'CANPS_TEST';
    case 'staging':
      return 'CANPS_STAGING';
    case 'production':
      return 'CANPS_PRODUCTION';
    case 'development':
    default:
      return 'CANPS_DEV';
  }
}

type SelectedEnv = BaseEnv & Partial<EnvSpecific>;

function selectEnvironmentVariables(rawEnv: Record<string, string | undefined>): SelectedEnv {
  const baseEnv = baseSchema.parse(rawEnv);
  const prefix = getEnvironmentPrefix(baseEnv.NODE_ENV);

  // Build an object with the prefixed keys (still raw strings)
  const rawPrefixed: Record<string, string | undefined> = {
    DATABASE_URL: rawEnv[`${prefix}_DATABASE_URL`],
    REDIS_URL: rawEnv[`${prefix}_REDIS_URL`],
    JWT_ACCESS_SECRET: rawEnv[`${prefix}_JWT_ACCESS_SECRET`],
    JWT_REFRESH_SECRET: rawEnv[`${prefix}_JWT_REFRESH_SECRET`],
    OPENWEATHERMAP_API_KEY: rawEnv[`${prefix}_OPENWEATHERMAP_API_KEY`],
    VAPID_SUBJECT: rawEnv[`${prefix}_VAPID_SUBJECT`],
    VAPID_PUBLIC_KEY: rawEnv[`${prefix}_VAPID_PUBLIC_KEY`],
    VAPID_PRIVATE_KEY: rawEnv[`${prefix}_VAPID_PRIVATE_KEY`],
    LOG_LEVEL: rawEnv[`${prefix}_LOG_LEVEL`],
    CRYPTO_SECRET: rawEnv[`${prefix}_CRYPTO_SECRET`],
    CRYPTO_TIME_STEP: rawEnv[`${prefix}_CRYPTO_TIME_STEP`],
    CRYPTO_OTP_LENGTH: rawEnv[`${prefix}_CRYPTO_OTP_LENGTH`],
    CRYPTO_HASH_ALGO: rawEnv[`${prefix}_CRYPTO_HASH_ALGO`],
    SALT_ROUND: rawEnv[`${prefix}_SALT_ROUND`],
  };

  // Parse the raw object with the schema – this coerces strings to numbers
  const envSpecific = envSpecificSchema.partial().parse(rawPrefixed);

  return { ...baseEnv, ...envSpecific };
}

const selectedEnv = selectEnvironmentVariables(process.env);
const appEnvSchema = z.object({
  ...baseSchema.shape,
  ...envSpecificSchema.shape,
});

const parsedEnv = appEnvSchema.parse(selectedEnv);

export const env = parsedEnv;
export const DATABASE_URL = parsedEnv.DATABASE_URL;
export const REDIS_URL = parsedEnv.REDIS_URL;
export const JWT_ACCESS_SECRET = parsedEnv.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = parsedEnv.JWT_REFRESH_SECRET;
export const OPENWEATHERMAP_API_KEY = parsedEnv.OPENWEATHERMAP_API_KEY;
export const VAPID_SUBJECT = parsedEnv.VAPID_SUBJECT;
export const VAPID_PUBLIC_KEY = parsedEnv.VAPID_PUBLIC_KEY;
export const VAPID_PRIVATE_KEY = parsedEnv.VAPID_PRIVATE_KEY;
export const CANPS_DEV_OPENWEATHERMAP_API_KEY = parsedEnv.OPENWEATHERMAP_API_KEY;
export const JwtSignOptions: JwtSignature = {
  issuer: 'CanopyShield',
  subject: 'Authentication Token',
  audience: 'https://canopyshield.com'
};
export const JwtAccessOptions: SignOptions = {
  issuer: 'CanopyShield',
  subject: 'AccessToken',
  audience: 'https://canopyshield.com',
  expiresIn: '2d'      // or 900 seconds
};

export const JwtRefreshOptions: SignOptions = {
  issuer: 'CanopyShield',
  subject: 'RefreshToken',
  audience: 'https://canopyshield.com',
  expiresIn: '7d'
};

export const JwtTempTokenOptions: SignOptions = {
  issuer: 'CanopyShield',
  subject: 'TempToken',
  audience: 'https://canopyshield.com',
  expiresIn: '5m'
};
