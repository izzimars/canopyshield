const engagementQueries = {
  // Quiz
  insertQuizQuestion: `
    INSERT INTO quiz_questions (question_text, options, correct_index, topic_tag, scheduled_date)
    VALUES ($1, $2, $3, $4, now())
    RETURNING question_uuid, question_text, options, correct_index, topic_tag, scheduled_date
  `,
  selectRandomScheduledQuestion: `
    SELECT question_uuid, question_text, options, correct_index, topic_tag
    FROM quiz_questions
    ORDER BY random()
    LIMIT 1
  `,
  selectQuestionById: `
    SELECT question_uuid, question_text, options, correct_index, topic_tag
    FROM quiz_questions
    WHERE question_uuid = $1
  `,

  // Engagement events
  insertEngagementEvent: `
    INSERT INTO engagement_events (user_id, school_id, type, points)
    VALUES ($1, $2, $3, $4)
    RETURNING engagement_uuid
  `,

  // User points
  getUserById: `
    SELECT id, user_uuid, email, points, school_id
    FROM users
    WHERE user_uuid = $1
  `,
  updateUserPoints: `
    UPDATE users SET points = $2, updated_at = now() WHERE user_uuid = $1 RETURNING points
  `,

  // School points upsert
  upsertSchoolPoints: `
    INSERT INTO school_points (school_id, total)
    VALUES ($1, $2)
    ON CONFLICT (school_id) DO UPDATE SET total = school_points.total + EXCLUDED.total, updated_at = now()
    RETURNING school_id, total
  `,
  getSchoolPoints: `
    SELECT school_id, total FROM school_points WHERE school_id = $1
  `,

  // Tree requests
  insertTreeRequestIfMissing: `
    INSERT INTO tree_requests (school_id, status)
    SELECT $1, 'pending'
    WHERE NOT EXISTS (SELECT 1 FROM tree_requests WHERE school_id = $1 AND status = 'pending')
    RETURNING request_uuid
  `,

  // Badges
  insertBadgeIfMissing: `
    INSERT INTO badges (user_id, type)
    SELECT $1, $2
    WHERE NOT EXISTS (SELECT 1 FROM badges WHERE user_id = $1 AND type = $2)
    RETURNING badge_uuid
  `,

  countUserShares: `
    SELECT COUNT(*)::int as cnt FROM engagement_events WHERE user_id = $1 AND type = 'share'
  `,

  sumUserDonations: `
    SELECT COALESCE(SUM(points),0)::int as total FROM engagement_events WHERE user_id = $1 AND type = 'donation'
  `,
};

export default engagementQueries;
