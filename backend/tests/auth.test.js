const request = require('supertest');
const app = require('../src/app');
const { createUser, authHeader, createLab } = require('./helpers');

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('returns token on valid credentials', async () => {
      const { user } = await createUser({ email: 'admin@test.com', password: 'Password123' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Password123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('rejects invalid password', async () => {
      await createUser({ email: 'admin2@test.com', password: 'Password123' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin2@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'Password123' });
      expect(res.status).toBe(401);
    });

    it('rejects missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password123' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user when authenticated', async () => {
      const { token, user } = await createUser();
      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(user.email);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set({ Authorization: 'Bearer invalidtoken' });
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/updatepassword', () => {
    it('updates password with correct current password', async () => {
      const { token } = await createUser({ email: 'pwd@test.com', password: 'OldPass123' });
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set(authHeader(token))
        .send({ currentPassword: 'OldPass123', newPassword: 'NewPass456' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('rejects wrong current password', async () => {
      const { token } = await createUser({ email: 'pwd2@test.com', password: 'OldPass123' });
      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set(authHeader(token))
        .send({ currentPassword: 'WrongPass', newPassword: 'NewPass456' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/logout', () => {
    it('logs out authenticated user', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .get('/api/auth/logout')
        .set(authHeader(token));
      expect(res.status).toBe(200);
    });
  });
});
