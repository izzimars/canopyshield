import { BaseEntity } from '../../shared/utils/base-entity';

export class SubscribeDto extends BaseEntity<SubscribeDto> {
  endpoint!: string;
  keys!: {
    p256dh: string;
    auth: string;
  };
}

export class UnsubscribeDto extends BaseEntity<UnsubscribeDto> {
  endpoint!: string;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  data?: Record<string, unknown>;
  eventType?: string;
  dedupId?: string;
  dedupTtlSeconds?: number;
};
