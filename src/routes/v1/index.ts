import express from 'express';
import authRouter from '../../modules/authentication/routes';
import schoolsRouter from '../../modules/schools/routes';
import engagementRouter from '../../modules/engagement/routes';
import usersRouter from '../../modules/users/routes';
import pushRouter from '../../modules/push/routes';
import adminRouter from '../../modules/admin/routes';
import schoolRequestsRouter from '../../modules/schoolRequests/routes';
import crowdfundingRouter from '../../modules/crowdfunding/routes';
import paymentRouter from '../../modules/payments/routes';
import app from '../../config/express';

const appRouter = express.Router();

appRouter.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'canopyshield',
    timestamp: new Date().toISOString(),
  });
});

appRouter.use(authRouter);
appRouter.use(schoolsRouter);
appRouter.use(engagementRouter);
appRouter.use(usersRouter);
appRouter.use(pushRouter);
appRouter.use(schoolRequestsRouter);
appRouter.use(crowdfundingRouter);
appRouter.use(paymentRouter);
appRouter.use('/admin', adminRouter);

export const Router = appRouter;
