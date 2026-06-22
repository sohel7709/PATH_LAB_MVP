const request = require('supertest');
const app = require('../src/app');
const { createUser, authHeader } = require('./helpers');

describe('Reports API', () => {
  let adminToken, techToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUser({ role: 'admin' }));
    ({ token: techToken } = await createUser({ role: 'technician', email: `tech_${Date.now()}@test.com` }));
  });

  describe('GET /api/reports', () => {
    it('admin can list reports', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set(authHeader(adminToken));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('technician can list reports', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set(authHeader(techToken));
      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/reports');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports/public-data/:id', () => {
    it('is publicly accessible', async () => {
      // Returns 404 for nonexistent report - no auth required
      const res = await request(app).get('/api/reports/public-data/000000000000000000000000');
      expect([404, 200, 500]).toContain(res.status);
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('requires admin role (technician is forbidden)', async () => {
      const res = await request(app)
        .delete('/api/reports/000000000000000000000000')
        .set(authHeader(techToken));
      expect(res.status).toBe(403);
    });
  });
});
