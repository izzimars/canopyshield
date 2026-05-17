import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('GET /api/v1/school-requests', () => {
  afterEach(() => {
    // restore any sinon stubs in _app
  });

  it('should list pending school requests', async () => {
    const app = buildAuthTestApp(true);
    const response = await request(app).get('/api/v1/school-requests')
      .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`);

    process.env.SCHOOL_PENDING_ONE_UUID = response.body.data[0].school_uuid;
    process.env.SCHOOL_PENDING_TWO_UUID = response.body.data[1].school_uuid;
    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.message).to.equal('Pending requests fetched successfully');
    expect(response.body.data).to.be.an('array');
  });

  it('should return 403 when non‑admin user tries to access', async () => {
    const app = buildAuthTestApp(true);
    const res = await request(app)
      .get('/api/v1/school-requests')
      .set('Authorization', `Bearer ${process.env.USER_1_TOKEN}`);
    expect(res.status).to.equal(403); // or 401/404 depending on your auth design
  });

  it('should return 401 when no token provided', async () => {
    const app = buildAuthTestApp();
    const res = await request(app).get('/api/v1/school-requests');
    expect(res.status).to.equal(401);
  });
});