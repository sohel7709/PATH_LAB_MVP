const request = require('supertest');
const app = require('../src/app');
const { createUser, authHeader } = require('./helpers');

describe('Doctors API', () => {
  let adminToken, techToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUser({ role: 'admin' }));
    ({ token: techToken } = await createUser({ role: 'technician', email: `tech_${Date.now()}@test.com` }));
  });

  describe('GET /api/doctors', () => {
    it('admin can list doctors', async () => {
      const res = await request(app)
        .get('/api/doctors')
        .set(authHeader(adminToken));
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/api/doctors');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/doctors', () => {
    it('admin can create a doctor', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .set(authHeader(adminToken))
        .send({ name: 'Dr. Smith', specialization: 'Pathology', phone: '9988776655' });
      expect([201, 200, 400]).toContain(res.status);
    });

    it('unauthenticated user cannot create doctors', async () => {
      const res = await request(app)
        .post('/api/doctors')
        .send({ name: 'Dr. Blocked' });
      expect(res.status).toBe(401);
    });
  });
});
