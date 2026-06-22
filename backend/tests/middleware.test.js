const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { createUser, authHeader, createLab } = require('./helpers');
const User = require('../src/models/User');
const Lab = require('../src/models/Lab');

describe('Auth Middleware', () => {
  it('blocks requests with expired token', async () => {
    const lab = await createLab();
    const user = await User.create({
      name: 'Expired',
      email: 'expired@test.com',
      password: 'Pass123',
      role: 'admin',
      lab: lab._id,
    });
    const expiredToken = jwt.sign(
      { id: user._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    const res = await request(app)
      .get('/api/auth/me')
      .set({ Authorization: `Bearer ${expiredToken}` });
    expect(res.status).toBe(401);
  });

  it('blocks requests for inactive lab', async () => {
    const lab = await createLab({ name: 'Inactive Lab', status: 'inactive' });
    const user = await User.create({
      name: 'InactiveLab User',
      email: 'inactive@test.com',
      password: 'Pass123',
      role: 'admin',
      lab: lab._id,
    });
    const token = jwt.sign(
      { id: user._id, role: 'admin', lab: lab._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    const res = await request(app)
      .get('/api/patients')
      .set({ Authorization: `Bearer ${token}` });
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('LAB_INACTIVE_OR_SUSPENDED');
  });

  it('allows super-admin even without a lab', async () => {
    const { token } = await createUser({ role: 'super-admin' });
    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader(token));
    expect(res.status).toBe(200);
  });

  it('authorize() blocks wrong role', async () => {
    const { token } = await createUser({ role: 'technician' });
    const res = await request(app)
      .delete('/api/reports/000000000000000000000000')
      .set(authHeader(token));
    expect(res.status).toBe(403);
  });
});
