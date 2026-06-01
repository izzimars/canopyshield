import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares';
import { paymentController } from './controller';

const router = Router();

// router.post('/initialize', requireAuth, paymentController.initializePayment);
router.get('/verify/:reference',requireAuth, paymentController.verifyPayment); // optional callback
router.post('/webhook/paystack', paymentController.paystackWebhook);

export default router;