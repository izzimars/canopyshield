import axios from 'axios';
import * as crypto from 'crypto';
import { env } from '../../config/env';

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = env.PAYSTACK_SECRET_KEY!;
  }

  async initializeTransaction(params: {
    email: string;
    amount: number; // in NGN (kobo internally)
    metadata: Record<string, any>;
    callbackUrl?: string;
  }) {
    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      {
        email: params.email,
        amount: params.amount * 100, // to kobo
        metadata: params.metadata,
        callback_url: params.callbackUrl,
      },
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );
    return response.data;
  }

  async verifyTransaction(reference: string) {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );
    return response.data;
  }

  async handleWebhook(payload: any, signature: string): Promise<boolean> {
    // Verify signature using your secret key
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    return hash === signature;
  }
}

export const paystackService = new PaystackService();
