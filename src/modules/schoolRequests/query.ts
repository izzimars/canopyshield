const schoolRequestQueries = {
  findPending: `
    SELECT request_uuid, school_name, address, requester_email, lat, lng, created_at
    FROM school_requests
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `,
  findById: `
    SELECT * FROM school_requests WHERE request_uuid = $1
  `,
  updateStatus: `
    UPDATE school_requests SET status = $1, admin_notes = $2, updated_at = now() WHERE request_uuid = $3 RETURNING *
  `,
};

export default schoolRequestQueries;
