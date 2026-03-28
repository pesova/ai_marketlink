import request from 'supertest';
import app from '../src/app';
import { createAdminUser, createVerifiedUser, signAccessToken } from './helpers/seed';

describe('/api/admin', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const user = await createVerifiedUser({ email: `u-${Date.now()}@test.com` });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${signAccessToken(user)}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Admin only/i);
  });

  it('GET /api/admin/escrows returns data for admin', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .get('/api/admin/escrows')
      .set('Authorization', `Bearer ${signAccessToken(admin)}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/admin/vendor/:vendorId/balances returns balances', async () => {
    const admin = await createAdminUser();
    const fakeVendorId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .get(`/api/admin/vendor/${fakeVendorId}/balances`)
      .set('Authorization', `Bearer ${signAccessToken(admin)}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.vendorId).toBe(fakeVendorId);
    expect(res.body.data?.holdingBalance).toBeDefined();
  });

  it('GET /api/admin/users supports pagination', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .get('/api/admin/users')
      .query({ page: 1, limit: 5 })
      .set('Authorization', `Bearer ${signAccessToken(admin)}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.users).toBeDefined();
    expect(res.body.data?.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/admin/orders supports pagination', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .get('/api/admin/orders')
      .query({ page: 1, limit: 5 })
      .set('Authorization', `Bearer ${signAccessToken(admin)}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.orders).toBeDefined();
  });

  it('POST /api/admin/dispute returns 400 when fields missing', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .post('/api/admin/dispute')
      .set('Authorization', `Bearer ${signAccessToken(admin)}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/orderId and action are required/i);
  });

  it('POST /api/admin/dispute returns 500 for invalid action', async () => {
    const admin = await createAdminUser();
    const res = await request(app)
      .post('/api/admin/dispute')
      .set('Authorization', `Bearer ${signAccessToken(admin)}`)
      .send({ orderId: '507f1f77bcf86cd799439011', action: 'invalid' });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/action must be/i);
  });
});
