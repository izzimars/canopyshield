// import { expect } from 'chai';
// import sinon from 'sinon';
// import { redis } from '../../../src/config/redis';
// import { buildAuthTestApp } from './_app';
// import request from 'supertest';

// describe('POST /api/v1/refresh', () => {
//   const app = buildAuthTestApp(true);

//   beforeEach(() => {
//     sinon.restore();
//     sinon.stub(redis, 'incr').resolves(1 as never);
//     sinon.stub(redis, 'expire').resolves(1 as never);
//   });

//   it('should fail when authorization token is missing', async () => {
//     const response = await request(app).post('/api/v1/refresh');

//     expect(response.status).to.equal(401);
//   });

//   it('should fail with empty authorization header', async () => {
//     const response = await request(app)
//       .post('/api/v1/refresh')
//       .set('Authorization', '');

//     expect(response.status).to.equal(401);
//   });

//   it('should fail with malformed bearer token', async () => {
//     const response = await request(app)
//       .post('/api/v1/refresh')
//       .set('Authorization', 'InvalidFormat');

//     expect(response.status).to.equal(401);
//   });
// });
