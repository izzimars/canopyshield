export default {
  getUserByUuid: `SELECT user_uuid, email, points, role, school_id, push_subscription, created_at, updated_at, (SELECT json_agg(json_build_object('type', type, 'awarded_at', awarded_at)) FROM badges b WHERE b.user_id = u.user_uuid) as badges, (SELECT jsonb_agg(alert_preferences) FROM alert_preferences ap WHERE ap.user_id = u.user_uuid) as alert_preferences FROM users u WHERE user_uuid = $1`,
  getUserBasic: `SELECT user_uuid, email, points, role, school_id FROM users WHERE user_uuid = $1`,
  getBadges: 'SELECT badge_uuid, type, awarded_at FROM badges WHERE user_id = $1',
  getAlertPreferences: 'SELECT risk_threshold, channels, frequency FROM alert_preferences WHERE user_id = $1',
  updateAlertPreferences: `INSERT INTO alert_preferences (user_id, risk_threshold, channels, frequency) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET risk_threshold = EXCLUDED.risk_threshold, channels = EXCLUDED.channels, frequency = EXCLUDED.frequency, updated_at = now()`
};
