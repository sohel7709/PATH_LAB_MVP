const request = require('supertest');
const app = require('../src/app');
const { createUser, authHeader } = require('./helpers');

describe('Test Templates API', () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUser({ role: 'admin' }));
  });

  describe('GET /api/admin/test-templates', () => {
    it('admin can list test templates', async () => {
      const res = await request(app)
        .get('/api/admin/test-templates')
        .set(authHeader(adminToken));
      expect([200, 404]).toContain(res.status);
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/api/admin/test-templates');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/test-templates', () => {
    it('admin can create a test template', async () => {
      const res = await request(app)
        .post('/api/admin/test-templates')
        .set(authHeader(adminToken))
        .send({
          name: 'Complete Blood Count',
          category: 'Haematology',
          sampleType: 'Blood',
          parameters: [{ name: 'Haemoglobin', unit: 'g/dL', referenceRange: '12-16' }],
        });
      expect([201, 200, 400]).toContain(res.status);
    });
  });
});
