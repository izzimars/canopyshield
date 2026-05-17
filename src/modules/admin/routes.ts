import { Router, Request, Response } from 'express';
import { adminController } from './controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth';

const router = Router();

/**
 * All admin routes require authentication and admin role
 */

/**
 * POST /admin/trees/confirm
 * Confirm tree planting request
 */
router.post('/trees/confirm', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  return adminController.confirmTree(req as any, res);
});

/**
 * GET /admin/trees/pending
 */
router.get('/trees/pending', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  return adminController.getPendingTrees(req as any, res);
});

/**
 * GET /admin/schools
 * Get all schools
 */
router.get('/schools', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  return adminController.getAllSchools(req as any, res);
});

/**
 * GET /admin/schools/:id
 * Get school by ID
 */
router.get('/schools/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  return adminController.getSchool(req as any, res);
});

/**
 * PUT /admin/schools/:id
 * Update school
 */
router.put('/schools/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  return adminController.updateSchool(req as any, res);
});

/**
 * DELETE /admin/schools/:id
 * Delete school (soft delete)
 */
router.delete('/schools/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  return adminController.deleteSchool(req as any, res);
});

/**
 * GET /admin/stats
 */
router.get('/stats', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  return adminController.getStats(req as any, res);
});

export default router;
