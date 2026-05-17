import { expect } from 'chai';
import { buildAuthTestApp } from './_app';
import request from 'supertest';

describe('POST /api/v1/login', () => {
  const app = buildAuthTestApp();

  it('should fail when email is missing', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      password: 'Password123!',
    });
   expect(response.status).to.equal(400);
  });

  it('should fail when email format is invalid', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'not-an-email',
      password: 'Password123!',
    });
    expect(response.status).to.equal(400);
  });

  it('should fail when email does not exist', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@test.dev',
      password: 'AnyPassword123!',
    });
    // Should be 401 with same message as invalid credentials
    expect(response.status).to.equal(401);
    expect(response.body.error.code).to.equal('UNAUTHORIZED');
  });

  it('should fail with invalid credentials', async () => {

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'student@test.dev',
      password: 'WrongPassword123!',
    });

    expect(response.status).to.equal(401);
    expect(response.body.error.code).to.equal('UNAUTHORIZED');
    expect(response.body.error.message).to.equal('AUTH_INVALID_CREDENTIALS');
  });

  it('should fail when account is not verified', async () => {
    // Register a user but don't verify
    // Then attempt login
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'student436@test.dev',
      password: 'Password123!',
    });
    expect(response.status).to.equal(401);
    expect(response.body.error.code).to.equal('UNAUTHORIZED');
  });

  it('should login successfully for case sensivity', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'Student@test.dev',
      password: 'Password123!',
    });
    expect(response.status).to.equal(200);
    expect(response.body.data).to.have.property('token');
    process.env.USER_1_TOKEN = response.body.data.token;
    process.env.USER_1_REFRESH_TOKEN = response.body.data.refreshToken;
    process.env.USER_1_ID = response.body.data.user.id;
  });

  it('should login successfully', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'student56@test.dev',
      password: 'Password123!',
    });
    process.env.USER_2_TOKEN = response.body.data.token;
    process.env.USER_2_REFRESH_TOKEN = response.body.data.refreshToken;
    process.env.USER_2_ID = response.body.data.user.id;
    expect(response.status).to.equal(200);
    expect(response.body.data).to.have.property('token');
  });

    it('should login successfully', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'student66@test.dev',
        password: 'Password123!',
      });

      expect(response.status).to.equal(200);
      expect(response.body.data).to.have.property('token');
      expect(response.body.data).to.have.property('refreshToken');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('id');
      expect(response.body.data.user).to.have.property('email');
      process.env.USER_3_TOKEN = response.body.data.token;
      process.env.USER_3_REFRESH_TOKEN = response.body.data.refreshToken;
      process.env.USER_3_ID = response.body.data.user.id;

    });

    it('should login Admin successfully', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'superadmin@yopmail.com',
        password: 'Password@1',
      });

      expect(response.status).to.equal(200);
      expect(response.body.data).to.have.property('token');
      expect(response.body.data).to.have.property('refreshToken');
      expect(response.body.data).to.have.property('user');
      expect(response.body.data.user).to.have.property('id');
      expect(response.body.data.user).to.have.property('email');
      process.env.ADMIN_1_TOKEN = response.body.data.token;
      process.env.ADMIN_1_REFRESH_TOKEN = response.body.data.refreshToken;
      process.env.ADMIN_1_ID = response.body.data.user.id;

    });
      

  it('should fail validation when password is missing', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'student@test.dev',
    });

    expect(response.status).to.equal(400);
  });
});
