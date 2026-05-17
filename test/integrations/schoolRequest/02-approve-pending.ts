import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('POST /api/v1/school-requests/:uuid/status', () => {
  afterEach(() => {
    // restore any sinon stubs in _app
  });

  it('should approve pending school request', async () => {
    const app = buildAuthTestApp(true);
    const response = await request(app).post(`/api/v1/school-requests/${process.env.SCHOOL_PENDING_ONE_UUID}/status`)
      .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`)
      .send({ status: 'approved' });

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.message).to.equal('Request approved successfully');
  });

    it('should return 403 when non‑admin user tries to approve', async () => {
    const app = buildAuthTestApp(true);
    const res = await request(app)
      .post(`/api/v1/school-requests/${process.env.SCHOOL_PENDING_ONE_UUID}/status`)
      .set('Authorization', `Bearer ${process.env.USER_1_TOKEN}`)
      .send({ status: 'approved' });
    expect(res.status).to.equal(403); // or 401/404 depending on your auth design
  });

  it('should return 401 when no token provided', async () => {
    const app = buildAuthTestApp();
    const res = await request(app).post(`/api/v1/school-requests/${process.env.SCHOOL_PENDING_ONE_UUID}/status`);
    expect(res.status).to.equal(401);
  });

});