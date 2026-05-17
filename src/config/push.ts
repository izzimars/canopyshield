import webpush from 'web-push';
import { env } from './env';

let initialized = false;

export function initializePushConfig(): void {
  if (initialized) {
    return;
  }

  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );

  initialized = true;
}

export { webpush };
