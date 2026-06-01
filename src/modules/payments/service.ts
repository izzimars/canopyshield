import { crowdfundingService } from '../crowdfunding/services';
import { env } from '../../config/env';
import { paystackService } from './paystack.service';
import { BadException } from '../../shared/errors';
import { logger } from '../../config/logger';
import { crowdfundingRepository } from '../crowdfunding';
import e from 'express';

export class PaymentService {
  async initializeContributionPayment(input: {
    userId: string;
    schoolId: string;
    amount: number;
    email: string;
    idempotencyKey: string;
  }) {
    const metadata = {
      userId: input.userId,
      schoolId: input.schoolId,
      idempotencyKey: input.idempotencyKey,
      type: 'tree_contribution',
    };

    const init = await paystackService.initializeTransaction({
      email: input.email,
      amount: input.amount,
      metadata,
      callbackUrl: env.PAYSTACK_CALLBACK_URL,
    });

    const paymentReference = init.data.reference;
    console.log('Payment initialized with reference:', paymentReference, init);

    await crowdfundingService.createPendingContribution({
      userId: input.userId,
      schoolId: input.schoolId,
      amount: input.amount,
      idempotencyKey: input.idempotencyKey,
      paymentReference: paymentReference,
    });

    return { authorizationUrl: init.data.authorization_url, reference: paymentReference };
  }

  async verifyAndProcessPayment(reference: string) {
    const verification = await paystackService.verifyTransaction(reference);
    if (verification.data.status !== 'success') {
      throw new Error(`Payment not successful: ${verification.data.gateway_response}`);
    }

    const { amount, metadata } = verification.data;
    // amount is in kobo – convert to NGN
    const amountNGN = amount / 100;

    const contribution = await crowdfundingRepository.findByPaymentReference(reference);
    if (!contribution) {
      logger.error('No contribution found for payment reference', { reference });
      return;
    }

    // 3. If already completed, skip (idempotent)
    if (contribution.status === 'completed') {
      logger.info('Contribution already processed', { contributionUuid: contribution.contribution_uuid });
      return;
    }

    // 4. Update contribution status to 'completed'
    await crowdfundingRepository.updateContributionStatus(contribution.contribution_uuid, 'completed');

    // 5. Finalize the contribution (plant trees, etc.)
    await crowdfundingService.finalizeContributionAfterPayment(contribution);

    return;
  }

  async webhookHandler(payload: any, signature: string) {
    const isValid = await paystackService.handleWebhook(payload, signature);
    if (!isValid) throw new Error('Invalid webhook signature');

    const event = payload.event;
    if (event === 'charge.success') {
      const reference = payload.data.reference;
      await this.verifyAndProcessPayment(reference);
    }
    return { received: true };
  }

}

export const paymentService = new PaymentService();