// import { expect } from 'chai';
// import sinon from 'sinon';
// import authServices from '../../../src/modules/authentication/services';
// import { redis } from '../../../src/config/redis';
// import { buildAuthTestApp } from './_app';
// import request from 'supertest';

// describe('POST /api/v1/logout', () => {
//   const app = buildAuthTestApp(true);

//   beforeEach(() => {
//     sinon.restore();
//     sinon.stub(redis, 'incr').resolves(1 as never);
//     sinon.stub(redis, 'expire').resolves(1 as never);
//   });

//   it('should logout successfully when user context exists', async () => {
//     sinon.stub(authServices, 'logout').resolves({ message: 'Logout successful' });

//     const response = await request(app)
//       .post('/api/v1/logout')
//       .set('x-test-user', JSON.stringify({ id: 'user-123', email: 'student@test.dev', user_uuid: 'uuid-123' }));

//     expect(response.status).to.equal(200);
//   });

//   it('should fail when user context is missing', async () => {
//     const response = await request(app).post('/api/v1/logout');

//     expect(response.status).to.equal(401);
//   });
// });
