// import { expect } from 'chai';
// import sinon from 'sinon';
// import { redis } from '../../../src/config/redis';
// import { buildAuthTestApp } from './_app';
// import request from 'supertest';

// describe('POST /api/v1/reset-password', () => {
//   const app = buildAuthTestApp();

//   beforeEach(() => {
//     sinon.restore();
//     sinon.stub(redis, 'incr').resolves(1 as never);
//     sinon.stub(redis, 'expire').resolves(1 as never);
//   });

//   it('should fail when token is missing', async () => {
//     const response = await request(app).post('/api/v1/reset-password').send({
//       password: 'NewPassword123!',
//       confirmPassword: 'NewPassword123!',
//     });

//     expect(response.status).to.equal(401);
//   });

//   it('should fail validation when password is too short', async () => {
//     const response = await request(app)
//       .post('/api/v1/reset-password')
//       .set('Authorization', 'Bearer')
//       .send({
//         password: 'Pass1!',
//         confirmPassword: 'Pass1!',
//       });

//     expect(response.status).to.equal(401);
//   });

//   it('should reject when passwords do not match', async () => {
//     const response = await request(app)
//       .post('/api/v1/reset-password')
//       .set('Authorization', '')
//       .send({
//         password: 'NewPassword123!',
//         confirmPassword: 'DifferentPassword123!',
//       });

//     expect(response.status).to.equal(401);
//   });
// });
