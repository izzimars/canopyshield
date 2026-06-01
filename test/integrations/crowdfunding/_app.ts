import express from 'express';
import crowdfundingRouter from '../../../src/modules/crowdfunding/routes';

export function buildCrowdfundingTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Inject test user from header
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
          role: 'user',
          email: 'user@test.dev',
          jti: 'jti-test-1',
          is_verified: true,
        };
      }
    }
    next();
  });

  app.use('/api/v1', crowdfundingRouter);
  return app;
}
