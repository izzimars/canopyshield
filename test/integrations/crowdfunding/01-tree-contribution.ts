import { expect } from 'chai';
import { v4 as uuidv4 } from 'uuid';
import { buildCrowdfundingTestApp } from './_app';
import request from 'supertest';
import { db } from '../../../src/config/database';

describe('POST /api/v1/payments/tree-contribution', () => {
  const app = buildCrowdfundingTestApp();

  let schoolId: string;
  let userId = 'user-test-1';

  before(async () => {
    // Create a test school
    const school = await db.one(
      `INSERT INTO schools (name, address, lat, lng, status, tree_count) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      ['Test School', 'Test Address', 0, 0, 'approved', 0]
    );
    schoolId = school.id;
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

  it('should create a tree contribution successfully', async () => {
    const idempotencyKey = uuidv4();
    const response = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 2000,
        idempotency_key: idempotencyKey,
      });

    expect(response.status).to.equal(201);
    expect(response.body.status).to.equal(true);
    expect(response.body.data.new_trees_planted).to.equal(0);
    expect(response.body.data.school_current_balance).to.equal(2000);
    expect(response.body.data.user_trees_funded).to.equal(0.4);
  });

  it('should plant trees when balance reaches TREE_PRICE', async () => {
    const idempotencyKey = uuidv4();
    const response = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 21400,
        idempotency_key: idempotencyKey,
      });

    expect(response.status).to.equal(201);
    expect(response.body.status).to.equal(true);
    expect(response.body.data.new_trees_planted).to.equal(4); // 21400 + 2000 = 23400, 23400 / 5000 = 4.68, so 4 trees
    expect(response.body.data.school_current_balance).to.equal(3400); // 23400 - 20000
    expect(response.body.data.user_trees_funded).to.equal(4.28); // (2000 + 21400) / 5000
  });

  it('should reject request without authentication', async () => {
    const response = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .send({
        school_id: schoolId,
        amount: 1000,
        idempotency_key: uuidv4(),
      });

    expect(response.status).to.equal(401);
  });

  it('should return 409 conflict for duplicate idempotency key', async () => {
    const idempotencyKey = uuidv4();

    // First request
    await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 1000,
        idempotency_key: idempotencyKey,
      });

    // Second request with same idempotency key
    const response = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 1000,
        idempotency_key: idempotencyKey,
      });

    expect(response.status).to.equal(409);
    expect(response.body.error.code).to.equal('DUPLICATE_CONTRIBUTION');
  });

  it('should return 404 for non-existent school', async () => {
    const response = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .send({
        school_id: 'non-existent-school',
        amount: 1000,
        idempotency_key: uuidv4(),
      });

    expect(response.status).to.equal(404);
    expect(response.body.error.code).to.equal('SCHOOL_NOT_FOUND');
  });

  it('should return 400 for invalid amount (zero)', async () => {
    const response = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 0,
        idempotency_key: uuidv4(),
      });

    expect(response.status).to.equal(400);
  });

  it('should return 400 for negative amount', async () => {
    const response = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .send({
        school_id: schoolId,
        amount: -500,
        idempotency_key: uuidv4(),
      });

    expect(response.status).to.equal(400);
  });

  it('should return 400 for invalid idempotency_key (not UUID)', async () => {
    const response = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId, role: 'user', email: 'user@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 1000,
        idempotency_key: 'invalid-uuid',
      });

    expect(response.status).to.equal(400);
  });

  it('should handle multiple contributions and plant correct number of trees', async () => {
    let userId2 = 'user-test-2';
    
    // User 1 donates 2000
    await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId2, role: 'user', email: 'user2@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 2000,
        idempotency_key: uuidv4(),
      });

    // User 1 donates 3000 - total 5000, should plant 1 tree
    const response2 = await request(app)
      .post('/api/v1/payments/tree-contribution')
      .set('x-test-user', JSON.stringify({ id: userId2, role: 'user', email: 'user2@test.dev' }))
      .send({
        school_id: schoolId,
        amount: 3000,
        idempotency_key: uuidv4(),
      });

    expect(response2.status).to.equal(201);
    expect(response2.body.data.new_trees_planted).to.equal(1);
    expect(response2.body.data.school_current_balance).to.equal(0);
  });
});
