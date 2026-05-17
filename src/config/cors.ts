import { logger } from './logger';

export interface CorsConfig {
  allowedWebOrigins: string[];
  allowAllMobileApps: boolean;
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}
export const getCorsConfig = (): CorsConfig => {
  const allowedWebOrigins = process.env.MONEXAR_ALLOWED_WEB_ORIGINS?.split(',') || [];
  const allowAllMobileApps = process.env.MONEXAR_ALLOW_ALL_MOBILE_APPS === 'true';

  return {
    allowedWebOrigins,
    allowAllMobileApps,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Device-ID',
      'X-Platform',
      'X-App-Version',
      'X-API-Key',
      'hash-id-key',
      'x-invite-token'
    ],
    credentials: true,
    maxAge: 86400
  };
};

export const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void): void => {
    const config = getCorsConfig();

    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow all mobile app origins if enabled
    if (config.allowAllMobileApps) {
      logger.info(`Mobile app origin allowed: ${origin}`);

      return callback(null, true);
    }

    // Check against allowed web origins
    if (config.allowedWebOrigins.includes(origin)) {
      logger.info(`Web origin allowed: ${origin}`);
      return callback(null, true);
    }

    // Origin not allowed
    logger.warn(`Origin blocked: ${origin}`);
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
  },

  methods: getCorsConfig().allowedMethods,
  allowedHeaders: getCorsConfig().allowedHeaders,
  credentials: getCorsConfig().credentials,
  maxAge: getCorsConfig().maxAge
};
