import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('GET /api/v1/schools/:uuid/risk/history', () => {

  it('should return the school risk score for User', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).get(`/api/v1/schools/${process.env.SCHOOL_ONE_UUID}/risk/history`)
      .set('Authorization', `Bearer ${process.env.USER_1_TOKEN}`);
    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.data[0]).to.have.property('school_id');
    expect(response.body.data[0]).to.have.property('score');
    expect(response.body.data[0]).to.have.property('aqi_score');
    expect(response.body.data[0]).to.have.property('heat_score');
    expect(response.body.data[0]).to.have.property('combined_score');
    expect(response.body.data[0]).to.have.property('raw_aqi');
  });

    it('should return the school risk score for Admin', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).get(`/api/v1/schools/${process.env.SCHOOL_TWO_UUID}/risk/history`)
      .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.data[0]).to.have.property('school_id');
    expect(response.body.data[0]).to.have.property('score');
  });

  it('should return 401 if invalid token provided', async () => {
    const app = buildAuthTestApp();
    const res = await request(app)
      .get(`/api/v1/schools/${process.env.SCHOOL_TWO_UUID}/risk/history`)
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).to.equal(401);
  });

  it('should return 404 for non-existent school UUID', async () => {
    const app = buildAuthTestApp();
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/v1/schools/${fakeUuid}/risk/history`)
      .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`);
    expect(res.status).to.equal(404);
  });

  it('should return 403/404 when user tries to access pending school', async () => {
    const app = buildAuthTestApp();
    const res = await request(app)
      .get(`/api/v1/schools/${process.env.SCHOOL_TWO_UUID}/risk/history`)
      .set('Authorization', `Bearer ${process.env.USER_1_TOKEN}`);
    // Depending on your policy: 403 Forbidden or 404 Not Found
    expect(res.status).to.be.oneOf([403, 404]);
  });

});