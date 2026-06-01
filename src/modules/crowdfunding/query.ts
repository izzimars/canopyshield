const crowdfundingQueries = {
  // Tree Contributions Queries
  insertContribution: `
    INSERT INTO tree_contributions (user_id, school_id, amount, amount_remaining,
      idempotency_key, status, funding_type, payment_reference ) VALUES ($1, $2, $3, $4, $5, 'pending', 'individual', $6)
    RETURNING id, contribution_uuid, created_at;
  `,

  findContributionByIdempotencyKey: `
    SELECT * FROM tree_contributions
    WHERE idempotency_key = $1
  `,

  getUserContributions: `
    SELECT * FROM tree_contributions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,

  countUserContributions: `
    SELECT COUNT(*) as total FROM tree_contributions
    WHERE user_id = $1
  `,

  getSchoolContributions: `
    SELECT * FROM tree_contributions
    WHERE school_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,

  countSchoolContributions: `
    SELECT COUNT(*) as total FROM tree_contributions
    WHERE school_id = $1
  `,

  // School Crowdfunding Queries
  upsertSchoolCrowdfunding: `
    INSERT INTO school_crowdfunding (school_id, current_balance, total_contributed, updated_at)
    VALUES ($1, $2, $2, NOW())
    ON CONFLICT (school_id) DO UPDATE SET
      current_balance = school_crowdfunding.current_balance + EXCLUDED.current_balance,
      total_contributed = school_crowdfunding.total_contributed + EXCLUDED.total_contributed,
      updated_at = NOW()
    RETURNING current_balance, total_contributed; 
  `,

  getSchoolBalance: `
    SELECT current_balance FROM school_crowdfunding WHERE school_id = $1;
  `,

  getSchoolCrowdfunding: `
    SELECT * FROM school_crowdfunding
    WHERE school_id = $1
    FOR UPDATE
  `,

  getSchoolCrowdfundingWithoutLock: `
    SELECT * FROM school_crowdfunding
    WHERE school_id = $1
  `,

  updateSchoolCrowdfundingBalance: `
    UPDATE school_crowdfunding
    SET current_balance = $2, updated_at = NOW()
    WHERE school_id = $1
  `,

  // User Crowdfunding Stats Queries
  upsertUserStats: `
    INSERT INTO user_crowdfunding_stats (user_id, total_contributed, trees_funded, updated_at)
    VALUES ($1, $2, FLOOR($2 / $3), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_contributed = user_crowdfunding_stats.total_contributed + $2,
      trees_funded = FLOOR((user_crowdfunding_stats.total_contributed + $2) / $3),
       updated_at = NOW()
    RETURNING *;
  `,

  getUserStats: `
    SELECT * FROM user_crowdfunding_stats
    WHERE user_id = $1
  `,

  // Tree Queries (for inserting new trees)
  insertTree: `
    INSERT INTO trees (school_id, source, planted_at)
    VALUES ($1, 'crowdfunding', NOW())
    RETURNING *
  `,

  // Crowdfunding Trees Count Query
  countCrowdfundingTrees: `
    SELECT COUNT(*) as total FROM trees
    WHERE school_id = $1 AND source = 'crowdfunding'
  `,

  updateSchoolTreeCount: `
    UPDATE schools SET tree_count = $2, updated_at = NOW() WHERE id = $1
  `,

  findByPaymentReference: `
    SELECT * FROM tree_contributions
    WHERE payment_reference = $1
  `,

  updateContributionStatus: `
    UPDATE tree_contributions
    SET status = $2, updated_at = NOW()
    WHERE payment_reference = $1
  `,

  insertContributionCost:`
    INSERT INTO tree_contribution_allocations (tree_id, school_id, amount, allocated_at)
    VALUES ($1, $2, $3, NOW())
  `
};

export default crowdfundingQueries;
