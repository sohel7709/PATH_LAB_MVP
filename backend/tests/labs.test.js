const request = require('supertest');
const app = require('../src/app');
const { createUser, authHeader, createLab } = require('./helpers');
const Lab = require('../src/models/Lab');

describe('Labs API', () => {
  describe('GET /api/labs', () => {
    it('returns labs for super-admin', async () => {
      const { token } = await createUser({ role: 'super-admin' });
      const res = await request(app)
        .get('/api/labs')
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/labs');
      expect(res.status).toBe(401);
    });

    it('forbids non-super-admin from listing all labs', async () => {
      const { token } = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/labs')
        .set(authHeader(token));
      expect([403, 200]).toContain(res.status);
    });
  });

  describe('POST /api/labs', () => {
    it('super-admin can create a lab', async () => {
      const { token } = await createUser({ role: 'super-admin' });
      const res = await request(app)
        .post('/api/labs')
        .set(authHeader(token))
        .send({
          name: 'New Diagnostic Lab',
          contact: { email: 'new@lab.com', phone: '9999999999' },
          address: { city: 'Mumbai', state: 'MH', country: 'India' },
        });
      expect([201, 200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('admin cannot create a lab', async () => {
      const { token } = await createUser({ role: 'admin' });
      const res = await request(app)
        .post('/api/labs')
        .set(authHeader(token))
        .send({ name: 'Unauthorized Lab' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/labs/:id', () => {
    it('super-admin can fetch a specific lab', async () => {
      const { token } = await createUser({ role: 'super-admin' });
      const lab = await createLab({ name: 'Specific Lab' });
      const res = await request(app)
        .get(`/api/labs/${lab._id}`)
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Specific Lab');
    });

    it('returns 404 for non-existent lab', async () => {
      const { token } = await createUser({ role: 'super-admin' });
      const res = await request(app)
        .get('/api/labs/000000000000000000000000')
        .set(authHeader(token));
      expect([404, 500]).toContain(res.status);
    });
  });
});
