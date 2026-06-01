import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares';
import { validate } from '../../shared/middlewares/validate';
import { TreeContributionRequestSchema, PaginationSchema  } from './validators';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { crowdfundingController } from './controller';

const router = Router();

// POST /api/v1/payments/tree-contribution
router.post(
  '/payments/tree-contribution',
  requireAuth,
  validate(TreeContributionRequestSchema),
  WatchAsyncController(crowdfundingController.createTreeContribution.bind(crowdfundingController))
);

// GET /api/v1/users/me/contributions
router.get(
  '/users/me/contributions',
  requireAuth,
  WatchAsyncController(crowdfundingController.getUserContributions.bind(crowdfundingController))
);

// GET /api/v1/schools/:schoolId/contributions
router.get(
  '/schools/:schoolId/contributions',
  requireAuth,
  validate(PaginationSchema),
  WatchAsyncController(crowdfundingController.getSchoolContributions.bind(crowdfundingController))
);

export default router;
