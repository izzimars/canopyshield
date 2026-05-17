import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('GET /api/v1/auth/verify-otp', () => {
  const app = buildAuthTestApp();


  it('should verify OTP successfully', async () => {


    const response = await request(app).get('/api/v1/auth/verify-otp').query({
      email: 'student@test.dev',
      code: process.env.USER_1_VERIFICATION_OTP,
      type: 'verification',
    });

    console.log('Response body:', response.body.error);
    expect(response.status).to.equal(200);
    expect(response.body.data).to.have.property('token');
  });

  it('should verify OTP successfully', async () => {
    const response = await request(app).get('/api/v1/auth/verify-otp').query({
      email: 'student56@test.dev',
      code: process.env.USER_2_VERIFICATION_OTP,
      type: 'verification',
    });

    console.log('Response body:', response.body.error);
    expect(response.status).to.equal(200);
    expect(response.body.data).to.have.property('token');
  });

  it('should verify OTP successfully', async () => {
    const response = await request(app).get('/api/v1/auth/verify-otp').query({
      email: 'student66@test.dev',
      code: process.env.USER_3_VERIFICATION_OTP,
      type: 'verification',
    });
    console.log('Response body:', response.body);

    expect(response.status).to.equal(200);
    expect(response.body.data).to.have.property('token');
  });

  it('should fail for invalid OTP code', async () => {
    const response = await request(app).get('/api/v1/auth/verify-otp').query({
      email: 'student@test.dev',
      code: '000000',
      type: 'verification',
    });
    expect(response.status).to.equal(401);
    expect(response.body.error.code).to.equal('UNAUTHORIZED');
    expect(response.body.error.message).to.equal('Invalid OTP code');
  });

  it('should fail validation when OTP code length is invalid', async () => {
    const response = await request(app).get('/api/v1/auth/verify-otp').query({
      email: 'student@test.dev',
      code: '12345',
      type: 'verification',
    });

    expect(response.status).to.equal(400);
  });
});
