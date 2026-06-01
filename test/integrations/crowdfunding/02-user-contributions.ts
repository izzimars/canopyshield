import { expect } from 'chai';
import { v4 as uuidv4 } from 'uuid';
import { buildCrowdfundingTestApp } from './_app';
import request from 'supertest';
import { db } from '../../../src/config/database';

describe('GET /api/v1/users/me/contributions', () => {
  const app = buildCrowdfundingTestApp();

  let schoolId: string;
  let userId = 'user-contributions-test-1';

  before(async () => {
    // Create a test school
    const school = await db.one(
      `INSERT INTO schools (name, address, lat, lng, status, tree_count) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      ['Test School for Contributions', 'Test Address', 0, 0, 'approved', 0]
    );
    schoolId = school.id;

    // Create multiple contributions
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/payments/tree-contribution')
        .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
        .send({
          school_id: schoolId,
          amount: 1000 + (i * 500),
          idempotency_key: uuidv4(),
        });
    }
  });

  after(async () => {
    // Clean up test data
    if (schoolId) {
      await db.none('DELETE FROM tree_contributions WHERE school_id = $1', [schoolId]);
      await db.none('DELETE FROM school_crowdfunding WHERE school_id = $1', [schoolId]);
      await db.none('DELETE FROM trees WHERE school_id = $1', [schoolId]);
      await db.none('DELETE FROM schools WHERE id = $1', [schoolId]);
    }
    if (userId) {
      await db.none('DELETE FROM user_crowdfunding_stats WHERE user_id = $1', [userId]);
    }
  });

  it('should get user contributions successfully', async () => {
    const response = await request(app)
      .get('/api/v1/users/me/contributions')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .query({ page: 1, limit: 10 });

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.data.total_contributed).to.be.a('number');
    expect(response.body.data.trees_funded).to.be.a('number');
    expect(response.body.data.contributions).to.be.an('array');
    expect(response.body.data.pagination.page).to.equal(1);
    expect(response.body.data.pagination.limit).to.equal(10);
    expect(response.body.data.pagination.total).to.be.at.least(3);
  });

  it('should return paginated results', async () => {
    const response = await request(app)
      .get('/api/v1/users/me/contributions')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .query({ page: 1, limit: 2 });

    expect(response.status).to.equal(200);
    expect(response.body.data.contributions.length).to.be.at.most(2);
  });

  it('should reject request without authentication', async () => {
    const response = await request(app)
      .get('/api/v1/users/me/contributions')
      .query({ page: 1, limit: 10 });

    expect(response.status).to.equal(401);
  });

  it('should use default pagination values', async () => {
    const response = await request(app)
      .get('/api/v1/users/me/contributions')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }));

    expect(response.status).to.equal(200);
    expect(response.body.data.pagination.page).to.equal(1);
    expect(response.body.data.pagination.limit).to.equal(10);
  });

  it('should return empty contributions for user with no contributions', async () => {
    const newUserId = 'user-no-contributions-test';
    const response = await request(app)
      .get('/api/v1/users/me/contributions')
      .set('x-test-user', JSON.stringify({ id: newUserId, role: 'user', email: 'new@test.dev' }))
      .query({ page: 1, limit: 10 });

    expect(response.status).to.equal(200);
    expect(response.body.data.total_contributed).to.equal(0);
    expect(response.body.data.trees_funded).to.equal(0);
    expect(response.body.data.contributions).to.be.an('array').that.is.empty;
    expect(response.body.data.pagination.total).to.equal(0);
  });

  it('should validate pagination parameters', async () => {
    const response = await request(app)
      .get('/api/v1/users/me/contributions')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .query({ page: 0, limit: 10 }); // page must be positive

    expect(response.status).to.equal(400);
  });

  it('should respect limit parameter maximum', async () => {
    const response = await request(app)
      .get('/api/v1/users/me/contributions')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .query({ page: 1, limit: 200 }); // limit is capped at 100

    expect(response.status).to.equal(400);
  });
});
