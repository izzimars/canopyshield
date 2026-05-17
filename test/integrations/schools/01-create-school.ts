import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('POST /api/v1/schools', () => {
  afterEach(() => {
    // restore any sinon stubs in _app
  });

  it('should register a school by admin', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).post('/api/v1/schools')
      .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`)
      .send({
        name: 'Test School',
        location: '123 Test St, Test City',
        treeCount: 5,
        lat: 40.7128,
        lng: -74.0060,
      });

    expect(response.status).to.equal(201);
    expect(response.body.status).to.equal(true);
    expect(response.body.data).to.be.an('object');
    expect(response.body.data.name).to.equal('Test School');
    expect(response.body.data.address).to.equal('123 Test St, Test City');
    expect(response.body.data.tree_count).to.equal(5);
    process.env.SCHOOL_ONE_UUID = response.body.data.school_uuid;
  });

  it('should register a school by user', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).post('/api/v1/schools')
      .set('Authorization', `Bearer ${process.env.USER_1_TOKEN}`)
      .send({
        name: 'Test School 2',
        location: '124 Test St, Test City',
        treeCount: 9,
        lat: 40.7138,
        lng: -74.0050,
      });

    expect(response.status).to.equal(201);
    expect(response.body.status).to.equal(true);
    expect(response.body.data).to.be.an('object');
    expect(response.body.data.name).to.equal('Test School 2');
    expect(response.body.data.address).to.equal('124 Test St, Test City');
    expect(response.body.data.tree_count).to.equal(9);
    process.env.SCHOOL_TWO_UUID = response.body.data.school_uuid;
  });

  it('should return 400 when admin creates school without lat', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).post('/api/v1/schools')
      .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`)
      .send({
        name: 'No Lat School',
        location: 'Somewhere',
        treeCount: 5,
        lng: -74.0060,
      });
    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal(false);
  });

  it('should return 400 when admin creates school without lng', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).post('/api/v1/schools')
      .set('Authorization', `Bearer ${process.env.ADMIN_1_TOKEN}`)
      .send({
        name: 'No Lng School',
        location: 'Somewhere',
        treeCount: 5,
        lat: 40.7128,
      });
    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal(false);
  });

  it('should allow user to create school without lat/lng', async () => {
    const app = buildAuthTestApp();
    const response = await request(app).post('/api/v1/schools')
      .set('Authorization', `Bearer ${process.env.USER_1_TOKEN}`)
      .send({
        name: 'User School No Coords',
        location: 'Somewhere',
        treeCount: 3,
      });
    expect(response.status).to.equal(201);
  });
});