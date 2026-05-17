const schoolQueries = {
  findAll: `
    SELECT school_uuid, name, address, contact_email, lat, lng, current_risk_score, tree_count, created_at, updated_at
    FROM schools
    WHERE status = ANY($1)
    ORDER BY name ASC
  `,

  createSchool: `
    INSERT INTO schools (name, address, tree_count, lng, lat, status)
    VALUES ($1, $2, COALESCE($3, 0), $4, $5, $6)
    RETURNING *
  `,

  findById: `
    SELECT school_uuid, name, address, contact_email, lat, lng, current_risk_score, tree_count, created_at, updated_at
    FROM schools
    WHERE school_uuid = $1
  `,

  findByUuId: `
    SELECT school_uuid, name, address, contact_email, lat, lng, current_risk_score, tree_count, created_at, updated_at, status
    FROM schools
    WHERE school_uuid = $1
  `,

  updateStatus: `
    UPDATE schools
    SET status = $2, updated_at = now()
    WHERE school_uuid = $1
    RETURNING *
  `,
  
  updateRiskScore: `
    UPDATE schools
    SET current_risk_score = $2, updated_at = now()
    WHERE school_uuid = $1
  `,
  updateTreeCount: `
    UPDATE schools
    SET tree_count = $2, updated_at = now()
    WHERE school_uuid = $1
  `,
  leaderboardByRisk: `
    SELECT school_uuid, name, current_risk_score, tree_count
    FROM schools
    WHERE status = ANY($1)
    ORDER BY current_risk_score DESC, name ASC
  `,
  leaderboardByTrees: `
    SELECT school_uuid, name, current_risk_score, tree_count
    FROM schools
    WHERE status = ANY($1)
    ORDER BY tree_count DESC, name ASC
  `,
  createRiskSnapshot: `
    INSERT INTO risk_snapshots (school_id, score, heat_score, aqi_score, raw_data, combined_score, raw_temp, raw_humidity, raw_uv, raw_aqi)
    VALUES ($1, $2, $3, $4, $5, $2, $6, $7, $8, $9)
    RETURNING risk_uuid, school_id, score, heat_score, aqi_score, raw_data, created_at
  `,
  findLatestRisk: `
    SELECT risk_uuid, school_id, score, heat_score, aqi_score, raw_data, created_at
    FROM risk_snapshots
    WHERE school_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `,
  findRiskHistory: `
    SELECT risk_uuid, school_id, score, heat_score, aqi_score, raw_data, created_at
    FROM risk_snapshots
    WHERE school_id = $1
      AND created_at >= now() - ($2::text || ' days')::interval
    ORDER BY created_at DESC
  `,
};

export default schoolQueries;
