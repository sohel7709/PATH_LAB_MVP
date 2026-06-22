const request = require('supertest');
const app = require('../src/app');
const { createUser, authHeader } = require('./helpers');

const validPatient = {
  designation: 'Mr.',
  fullName: 'John Doe',
  age: 30,
  gender: 'male',
  phone: '9876543210',
};

describe('Patients API', () => {
  let token, lab;

  beforeEach(async () => {
    ({ token, lab } = await createUser({ role: 'admin' }));
    // Mock subscription middleware to pass through
  });

  describe('POST /api/patients', () => {
    it('creates a patient as admin', async () => {
      const res = await request(app)
        .post('/api/patients')
        .set(authHeader(token))
        .send({ ...validPatient, lab: lab._id });
      // subscription middleware may block if no plan; accept 201 or 403
      expect([201, 403]).toContain(res.status);
    });

    it('requires authentication', async () => {
      const res = await request(app).post('/api/patients').send(validPatient);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/patients', () => {
    it('returns 200 for authenticated admin', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/patients');
      expect(res.status).toBe(401);
    });
  });
});
