// import { expect } from 'chai';
// import sinon from 'sinon';
// import authServices from '../../../src/modules/authentication/services';
// import { redis } from '../../../src/config/redis';
// import { buildAuthTestApp } from './_app';
// import request from 'supertest';

// describe('POST /api/v1/forgot-password', () => {
//   const app = buildAuthTestApp();

//   beforeEach(() => {
//     sinon.restore();
//     sinon.stub(redis, 'incr').resolves(1 as never);
//     sinon.stub(redis, 'expire').resolves(1 as never);
//   });

//   it('should send forgot password OTP successfully and include OTP in test env', async () => {
//     sinon.stub(authServices, 'forgotPassword').resolves({
//       otp: '987654',
//     });

//     const response = await request(app).post('/api/v1/forgot-password').send({
//       email: 'student@test.dev',
//     });

//     expect(response.status).to.equal(200);
//     expect(response.body.data.otp).to.equal('987654');
//   });

//   it('should fail when email is not found', async () => {
//     sinon.stub(authServices, 'forgotPassword').rejects(new Error('Email not found'));

//     const response = await request(app).post('/api/v1/forgot-password').send({
//       email: 'nonexistent@test.dev',
//     });

//     expect(response.status).to.equal(500);
//   });

//   it('should fail validation for invalid email', async () => {
//     const response = await request(app).post('/api/v1/forgot-password').send({
//       email: 'invalid-email',
//     });

//     expect(response.status).to.equal(400);
//   });
// });
