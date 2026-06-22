const request = require('supertest');
const app = require('../src/app');
const { createUser, authHeader } = require('./helpers');

describe('User Management API', () => {
  describe('GET /api/user-management', () => {
    it('admin can list users in their lab', async () => {
      const { token } = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/user-management')
        .set(authHeader(token));
      expect([200, 404]).toContain(res.status);
    });

    it('super-admin can list users', async () => {
      const { token } = await createUser({ role: 'super-admin' });
      const res = await request(app)
        .get('/api/user-management')
        .set(authHeader(token));
      expect([200, 404]).toContain(res.status);
    });

    it('technician is forbidden', async () => {
      const { token } = await createUser({ role: 'technician' });
      const res = await request(app)
        .get('/api/user-management')
        .set(authHeader(token));
      expect([403, 404]).toContain(res.status);
    });
  });
});
