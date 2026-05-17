import { expect } from 'chai';
import sinon from 'sinon';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('POST /api/v1/auth/register', () => {
  const app = buildAuthTestApp();

  let originalToken: string | undefined;
  let originalTokenTwo: string | undefined;
  let originalTokenThree: string | undefined;

  before(() => {
    originalToken = process.env.USER_1_VERIFICATION_OTP;
    originalTokenTwo = process.env.USER_2_VERIFICATION_OTP;
    originalTokenThree = process.env.USER_3_VERIFICATION_OTP;
  });

  it('should register successfully and include OTP in test environment', async () => {

    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'student@test.dev',
      password: 'Password123!',
      username: 'student',
    });

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.message).to.equal('Verification email sent');
    expect(response.body.data.userId).to.be.a('string');
    expect(response.body.data.otp).to.be.a('string');
    expect(response.body.data.otp).to.have.lengthOf(6);
    process.env.USER_1_VERIFICATION_OTP = response.body.data.otp;
  });

  it('should register successfully and include OTP in test environment', async () => {

    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'student56@test.dev',
      password: 'Password123!',
      username: 'student56',
    });

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.message).to.equal('Verification email sent');
    expect(response.body.data.userId).to.be.a('string');
    expect(response.body.data.otp).to.be.a('string');
    expect(response.body.data.otp).to.have.lengthOf(6);
    process.env.USER_2_VERIFICATION_OTP = response.body.data.otp;
  });

  it('should register successfully and include OTP in test environment', async () => {

    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'student66@test.dev',
      password: 'Password123!',
      username: 'student66',
    });

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.message).to.equal('Verification email sent');
    expect(response.body.data.userId).to.be.a('string');
    expect(response.body.data.otp).to.be.a('string');
    expect(response.body.data.otp).to.have.lengthOf(6);
    process.env.USER_3_VERIFICATION_OTP = response.body.data.otp;
  });

  it('should register successfully and include OTP in test environment', async () => {

    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'student436@test.dev',
      password: 'Password123!',
      username: 'student436',
    });

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(true);
    expect(response.body.message).to.equal('Verification email sent');
    expect(response.body.data.userId).to.be.a('string');
    expect(response.body.data.otp).to.be.a('string');
    expect(response.body.data.otp).to.have.lengthOf(6);
    process.env.USER_4_VERIFICATION_OTP = response.body.data.otp;
  });

  it('should fail when email already exists', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'student@test.dev',
      password: 'Password123!',
      username: 'student',
    });
    expect(response.status).to.equal(409);
    expect(response.body.status).to.equal(false);
    expect(response.body.error.message).to.equal('User already exists');
  });

  it('should fail validation when password is too short', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'student@test.dev',
      password: 'Pass1!',
      username: 'student',
    });

    expect(response.status).to.equal(400);
    expect(response.body.success).to.equal(false);
    expect(response.body.error.code).to.equal('VALIDATION_ERROR');
    expect(response.body.error.message).to.equal('Validation failed');
    expect(response.body.error.details).to.have.lengthOf(1);
    expect(response.body.error.details[0].message).to.equal('Password must be at least 8 characters');
  });

  it('should fail validation when no body is passed', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
    });

    expect(response.status).to.equal(400);
    expect(response.body.success).to.equal(false);
    expect(response.body.error.code).to.equal('VALIDATION_ERROR');
    expect(response.body.error.message).to.equal('Validation failed');
    expect(response.body.error.details).to.have.lengthOf(2);
    expect(response.body.error.details[0].message).to.equal('Required');
    expect(response.body.error.details[1].message).to.equal('Required');
  });

  it('should fail when email format is malformed', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'invalid-email',
      password: 'Password123!',
      username: 'student',
    });
    
    expect(response.status).to.equal(400);
    expect(response.body.success).to.equal(false);
    expect(response.body.error.code).to.equal('VALIDATION_ERROR');
    expect(response.body.error.message).to.equal('Validation failed');
    expect(response.body.error.details).to.have.lengthOf(1);
    expect(response.body.error.details[0].message).to.equal('Invalid email format');
  })

  it('should fail when password has no uppercase', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({
    email: 'test@test.dev',
    password: 'password123!',
    username: 'student'
  });
  expect(res.status).to.equal(400);
  expect(res.body.error.details[0].message).to.include('uppercase');
});

it('should fail when password has no lowercase', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({
    email: 'test@test.dev',
    password: 'PASSWORD123!',
    username: 'student'
  });
  expect(res.status).to.equal(400);
  expect(res.body.error.details[0].message).to.include('lowercase');
});

it('should fail when password has no special character', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({
    email: 'test@test.dev',
    password: 'Password123',
    username: 'student'
  });
  expect(res.status).to.equal(400);
  expect(res.body.error.details[0].message).to.include('special character');
});

it('should fail when username is too short (1-2 chars)', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({
    email: 'test@test.dev',
    password: 'Password123!',
    username: 'ab'
  });
  expect(res.status).to.equal(400);
  expect(res.body.error.details[0].message).to.include('Username must be at least 3 characters');
});

it('should treat emails as case‑insensitive when checking duplicates', async () => {
  // First register with student@test.dev (already in your success test)
  // Then try with Student@Test.dev
  const res = await request(app).post('/api/v1/auth/register').send({
    email: 'Student@Test.dev',
    password: 'Password123!',
    username: 'student2'
  });
  expect(res.status).to.equal(409);
  expect(res.body.error.message).to.equal('User already exists');
});


it('should accept valid schoolId', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({
    email: 'school@test.dev',
    password: 'Password123!',
    username: 'schooluser',
    schoolId: 'sch_123'
  });
  expect(res.status).to.equal(200);
  expect(res.body.data.userId).to.exist;
});
});
