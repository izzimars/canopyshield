const pushQueries = {
  upsertSubscription: `
    INSERT INTO push_subscriptions (subscription_uuid, user_id, endpoint, p256dh, auth)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (endpoint)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth
    RETURNING subscription_uuid, user_id, endpoint, p256dh, auth, created_at
  `,
  findByUser: `
    SELECT subscription_uuid, user_id, endpoint, p256dh, auth, created_at
    FROM push_subscriptions
    WHERE user_id = $1
    ORDER BY created_at DESC
  `,
  findByUserAndEndpoint: `
    SELECT subscription_uuid, user_id, endpoint, p256dh, auth, created_at
    FROM push_subscriptions
    WHERE user_id = $1 AND endpoint = $2
    LIMIT 1
  `,
  deleteByUserAndEndpoint: `
    DELETE FROM push_subscriptions
    WHERE user_id = $1 AND endpoint = $2
  `,
  deleteByUser: `
    DELETE FROM push_subscriptions
    WHERE user_id = $1
  `,
  deleteByEndpoint: `
    DELETE FROM push_subscriptions
    WHERE endpoint = $1
  `,
  listVerifiedUserIds: `
    SELECT user_uuid
    FROM users
    WHERE verified_at IS NOT NULL
  `,
  listSchoolRecipients: `
    SELECT u.user_uuid
    FROM users u
    LEFT JOIN alert_preferences ap ON ap.user_id = u.user_uuid
    WHERE u.school_id = $1
      AND u.verified_at IS NOT NULL
      AND COALESCE(ap.risk_threshold, 60) <= $2
  `,
};

export default pushQueries;
