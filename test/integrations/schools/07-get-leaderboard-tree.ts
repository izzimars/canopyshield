import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('GET /api/v1/schools//leaderboard/trees', () => {

  it('should return the risk leaderboard for all schools for users', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).get(`/api/v1/schools/leaderboard/trees`)
      .set('Authorization', `Bearer ${process.env.USER_1_TOKEN}`);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.data[0]).to.have.property('school_uuid');
    expect(response.body.data[0]).to.have.property('name');
    expect(response.body.data[0]).to.have.property('current_risk_score');
    expect(response.body.data[0]).to.have.property('tree_count');
  });

    it('should return the risk leaderboard for all schools for Admin', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).get(`/api/v1/schools/leaderboard/trees`)
      .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`);

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.data[0]).to.have.property('school_uuid');
    expect(response.body.data[0]).to.have.property('current_risk_score');
  });

  it('should return 401 if invalid token provided', async () => {
    const app = buildAuthTestApp();
    const res = await request(app)
      .get(`/api/v1/schools/leaderboard/trees`)
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).to.equal(401);
  });

});
