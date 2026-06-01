import { expect } from 'chai';
import { v4 as uuidv4 } from 'uuid';
import { buildCrowdfundingTestApp } from './_app';
import request from 'supertest';
import { db } from '../../../src/config/database';

describe('GET /api/v1/schools/:schoolId/contributions', () => {
  const app = buildCrowdfundingTestApp();

  let schoolId: string;
  let userId1 = 'user-school-contrib-test-1';
  let userId2 = 'user-school-contrib-test-2';

  before(async () => {
    // Create a test school
    const school = await db.one(
      `INSERT INTO schools (name, address, lat, lng, status, tree_count) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      ['Test School for School Contributions', 'Test Address', 0, 0, 'approved', 0]
    );
    schoolId = school.id;

    // Create contributions from multiple users
    await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId1, role: 'user', email: 'user1@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 3000,
        idempotency_key: uuidv4(),
      });

    await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId2, role: 'user', email: 'user2@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 7000,
        idempotency_key: uuidv4(),
      });
  });

  after(async () => {
    // Clean up test data
    if (schoolId) {
      await db.none('DELETE FROM tree_contributions WHERE school_id = $1', [schoolId]);
      await db.none('DELETE FROM school_crowdfunding WHERE school_id = $1', [schoolId]);
      await db.none('DELETE FROM trees WHERE school_id = $1', [schoolId]);
      await db.none('DELETE FROM schools WHERE id = $1', [schoolId]);
    }
    if (userId1) {
      await db.none('DELETE FROM user_crowdfunding_stats WHERE user_id = $1', [userId1]);
    }
    if (userId2) {
      await db.none('DELETE FROM user_crowdfunding_stats WHERE user_id = $1', [userId2]);
    }
  });

  it('should get school contributions successfully', async () => {
    const response = await request(app)
      .get(`/api/v1/schools/${schoolId}/contributions`)
      .set('x-test-user', JSON.stringify({ id: userId1, role: 'user', email: 'user@test.dev' }));

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.data.current_balance).to.be.a('number');
    expect(response.body.data.total_contributed).to.be.a('number');
    expect(response.body.data.total_trees_planted_via_crowdfunding).to.be.a('number');
    expect(response.body.data.total_contributed).to.equal(10000); // 3000 + 7000
    expect(response.body.data.total_trees_planted_via_crowdfunding).to.equal(2); // 10000 / 5000 = 2
    expect(response.body.data.current_balance).to.equal(0); // 10000 - (2 * 5000)
  });

  it('should reject request without authentication', async () => {
    const response = await request(app)
      .get(`/api/v1/schools/${schoolId}/contributions`);

    expect(response.status).to.equal(401);
  });

  it('should return 404 for non-existent school', async () => {
    const response = await request(app)
      .get('/api/v1/schools/non-existent-school/contributions')
      .set('x-test-user', JSON.stringify({ id: userId1, role: 'user', email: 'user@test.dev' }));

    expect(response.status).to.equal(404);
    expect(response.body.error.code).to.equal('SCHOOL_NOT_FOUND');
  });

  it('should return zero values for school with no contributions', async () => {
    // Create a new school without contributions
    const newSchool = await db.one(
      `INSERT INTO schools (name, address, lat, lng, status, tree_count) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      ['School No Contributions', 'Test Address', 0, 0, 'approved', 0]
    );

    const response = await request(app)
      .get(`/api/v1/schools/${newSchool.id}/contributions`)
      .set('x-test-user', JSON.stringify({ id: userId1, role: 'user', email: 'user@test.dev' }));

    expect(response.status).to.equal(200);
    expect(response.body.data.current_balance).to.equal(0);
    expect(response.body.data.total_contributed).to.equal(0);
    expect(response.body.data.total_trees_planted_via_crowdfunding).to.equal(0);

    // Clean up
    await db.none('DELETE FROM schools WHERE id = $1', [newSchool.id]);
  });

  it('should return 400 when schoolId parameter is missing', async () => {
    const response = await request(app)
      .get('/api/v1/schools//contributions')
      .set('x-test-user', JSON.stringify({ id: userId1, role: 'user', email: 'user@test.dev' }));

    // This should return 404 because the route doesn't match
    expect(response.status).to.equal(404);
  });
});
