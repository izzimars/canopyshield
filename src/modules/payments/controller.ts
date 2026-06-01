import { Request, Response } from 'express';
import { PaymentService } from './service';
import { AuthRequest } from '../../shared/middlewares';
import { handleCustomError, handleCustomSuccess } from '../../shared/errors';
import * as dtos from './dto';
import { logger } from '../../config/logger';

const paymentService = new PaymentService();

export class PaymentController {
  // async initializePayment(req: AuthRequest, res: Response) {
  //   try {
  //     const { schoolId, amount, idempotencyKey } = req.body;
  //     const result = await paymentService.initializeContributionPayment({
  //       userId: req.user!.uuid, // or req.user.id
  //       schoolId,
  //       amount,
  //       email: req.user!.email,
  //       idempotencyKey
  //     });
  //     return handleCustomSuccess(res, 'Payment initialized successfully', 200, result);
  //   } catch (error: any) {
  //     logger.error('Error initializing payment:', error);
  //     return handleCustomError(res, error, 500, 'PAYMENT_INIT_FAILED');
  //   }
  // }

  async verifyPayment(req: Request, res: Response) {
    try {
      const payload = new dtos.verifyPaystackDto(req.params);
      const result = await paymentService.verifyAndProcessPayment(payload.reference);
      // Redirect or respond as needed
      return handleCustomSuccess(res, 'Payment verified successfully', 200, result);
    } catch (error: any) {
      logger.error('Error verifying payment:', error);
      return handleCustomError(res, error, 400, 'VERIFICATION_FAILED');
    }
  }

  async paystackWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      await paymentService.webhookHandler(req.body, signature);
      res.status(200).send('OK');
    } catch (error) {
      logger.error('Error processing Paystack webhook', error);
      res.status(400).send('Webhook error');
    }
  }

}

export const paymentController = new PaymentController();