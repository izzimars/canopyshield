/**
 * SQL queries for admin operations
 */

export const adminQueries = {
  // Tree confirmation
  getTreeRequestById: `
    SELECT * FROM tree_requests WHERE id = $1
  `,
  updateTreeRequestStatus: `
    UPDATE tree_requests SET status = $1, confirmed_at = NOW() WHERE id = $2 RETURNING *
  `,
  resetSchoolPoints: `
    UPDATE school_points SET points = 0 WHERE school_id = $1 RETURNING *
  `,

  // School management
  createSchool: `
    INSERT INTO schools (name, address, lat, lng, tree_count)
    VALUES ($1, $2, $3, $4, COALESCE($5, 0))
    RETURNING *
  `,
  updateSchool: `
    UPDATE schools SET name = $1, address = $2, lat = $3, lng = $4, tree_count = COALESCE($5, tree_count)
    WHERE school_uuid = $6
    RETURNING *
  `,
  softDeleteSchool: `
    UPDATE schools SET deleted_at = NOW() WHERE id = $1 RETURNING *
  `,
  getAllSchools: `
    SELECT * FROM schools WHERE deleted_at IS NULL ORDER BY name
  `,
  getSchoolById: `
    SELECT * FROM schools WHERE id = $1 AND deleted_at IS NULL
  `,
  // Tree requests pending
  listPendingTreeRequests: `
    SELECT tr.id, tr.school_id, s.name as school_name, tr.points_at_trigger as total_points_at_trigger, tr.created_at as requested_at
    FROM tree_requests tr
    JOIN schools s ON tr.school_id = s.school_uuid
    WHERE tr.status = 'pending'
    ORDER BY tr.created_at DESC
  `,

  // Admin logs
  insertAdminLog: `
    INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
};

export default adminQueries;
