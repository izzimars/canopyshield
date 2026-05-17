import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('POST /api/v1/resend-otp', () => {
  const app = buildAuthTestApp();

  it('should resend OTP successfully and include OTP in test env', async () => {
    const response = await request(app).post('/api/v1/auth/resend-otp').send({
      email: 'student436@test.dev',
      type: 'verification',
    });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('message', 'New OTP sent to email');
    expect(response.body.data).to.have.property('otp');
  });

  it('should fail when user is not found', async () => {
    const response = await request(app).post('/api/v1/auth/resend-otp').send({
      email: 'nonexistent@test.dev',
      type: 'verification',
    });

    expect(response.status).to.equal(404);
    expect(response.body.error.code).to.equal('USER_NOT_FOUND');
    expect(response.body.error.message).to.equal('Email not found');
  });

  it('should fail validation for invalid type', async () => {
    const response = await request(app).post('/api/v1/auth/resend-otp').send({
      email: 'student@test.dev',
      type: 'invalid',
    });

    expect(response.status).to.equal(400);
    expect(response.body.error.code).to.equal('VALIDATION_ERROR');
    expect(response.body.error.message).to.equal('Validation failed');
  });

  it('should fail when email is missing', async () => {
    const response = await request(app).post('/api/v1/auth/resend-otp').send({
      type: 'verification',
    });
    expect(response.status).to.equal(400);
    expect(response.body.error.code).to.equal('VALIDATION_ERROR');
  });

  it('should fail when type is missing', async () => {
    const response = await request(app).post('/api/v1/auth/resend-otp').send({
      email: 'student@test.dev',
    });
    expect(response.status).to.equal(400);
  });

  it('should fail when email format is invalid', async () => {
    const response = await request(app).post('/api/v1/auth/resend-otp').send({
      email: 'not-an-email',
      type: 'verification',
    });
    expect(response.status).to.equal(400);
  });

  it('should be case‑insensitive when looking up user', async () => {
  // Assumes a user exists with email 'student@test.dev'
    const response = await request(app).post('/api/v1/auth/resend-otp').send({
      email: 'Student436@Test.dev',
      type: 'verification',
    });
    expect(response.status).to.equal(200);
  });
});
