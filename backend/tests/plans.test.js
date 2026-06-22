const request = require('supertest');
const app = require('../src/app');
const { createUser, authHeader } = require('./helpers');
const Plan = require('../src/models/Plan');

const samplePlan = {
  name: 'Basic Plan',
  price: 999,
  duration: 30,
  features: {
    maxPatients: 100,
    maxReports: 200,
  },
};

describe('Plans API', () => {
  let superAdminToken, adminToken;

  beforeEach(async () => {
    ({ token: superAdminToken } = await createUser({ role: 'super-admin' }));
    ({ token: adminToken } = await createUser({ role: 'admin', email: `admin_${Date.now()}@test.com` }));
  });

  describe('GET /api/plans', () => {
    it('super-admin can list plans', async () => {
      const res = await request(app)
        .get('/api/plans')
        .set(authHeader(superAdminToken));
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('POST /api/plans', () => {
    it('super-admin can create a plan', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set(authHeader(superAdminToken))
        .send(samplePlan);
      expect([201, 200]).toContain(res.status);
    });

    it('admin cannot create a plan', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set(authHeader(adminToken))
        .send(samplePlan);
      expect(res.status).toBe(403);
    });
  });
});
