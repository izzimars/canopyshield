export const TreeQueries = {
    insertTree: `
        INSERT INTO tree (school_id, source, planted_at) VALUES ($1, $2, $3)
        RETURNING *
    `,
    
    incrementTreeCount: `
      UPDATE schools
      SET tree_count = tree_count + $1
       WHERE school_id = $2;
    `
}