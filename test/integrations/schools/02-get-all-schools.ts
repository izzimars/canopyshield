import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('GET /api/v1/schools', () => {

  it('should return 401 when no token is provided', async () => {
  const app = buildAuthTestApp();
  const response = await request(app).get('/api/v1/schools');
  expect(response.status).to.equal(401);
});

  it('should get all schools for admins', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).get('/api/v1/schools')
    .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.data).to.be.an('array');
    expect(response.body.data.length).to.be.greaterThan(0);
  });

  it('should get all schools for users', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).get('/api/v1/schools')
    .set('Authorization', `Bearer ${process.env.USER_1_TOKEN}`);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.data).to.be.an('array');
    expect(response.body.data.length).to.be.greaterThan(0);
  });
});
