import express from 'express';
import schoolRequestRouter from '../../../src/modules/schoolRequests/routes';

export function buildAuthTestApp(injectUserFromHeader: boolean = false) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  if (injectUserFromHeader) {
    app.use((req, _res, next) => {
      next();
    });
  }

  app.use('/api/v1', schoolRequestRouter);
  return app;
}
