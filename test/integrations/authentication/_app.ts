import express from 'express';
import authRouter from '../../../src/modules/authentication/routes';

export function buildAuthTestApp(injectUserFromHeader: boolean = false) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  if (injectUserFromHeader) {
    app.use((req, _res, next) => {
      const headerValue = req.headers['x-test-user'];
      if (headerValue) {
        try {
          (req as any).user = JSON.parse(headerValue as string);
        } catch (e) {
          (req as any).user = {
            id: 'user-test-1',
            user_uuid: 'user-test-1',
            uuid: 'user-test-1',
            role: 'admin',
            email: 'admin@test.dev',
            jti: 'jti-test-1',
            is_verified: true,
          };
        }
      }
      next();
    });
  }

  app.use('/api/v1', authRouter);
  return app;
}
