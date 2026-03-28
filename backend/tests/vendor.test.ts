import request from 'supertest';
import app from '../src/app';
import {
  createVerifiedUser,
  createVendorForUser,
  signAccessToken,
} from './helpers/seed';

const onboardPayload = (suffix: string) => {
  const nin = String(suffix).replace(/\D/g, '').slice(-11).padStart(11, '0');
  return {
    name: `Vendor ${suffix}`,
    email: `vendor-${suffix}@test.com`,
    password: 'password12',
    confirmPassword: 'password12',
    firstName: 'John',
    lastName: 'Doe',
    businessName: `Biz ${suffix}`,
    nin,
    phoneNumber: '+2348012345678',
  };
};

describe('POST /api/vendors/onboard', () => {
  it('returns 422 when required vendor fields are missing', async () => {
    const res = await request(app).post('/api/vendors/onboard').send({
      name: 'X',
      email: 'v@test.com',
      password: 'password12',
      confirmPassword: 'password12',
    });
    expect(res.status).toBe(422);
    expect(res.body.errors?.length).toBeGreaterThan(0);
  });

  it('returns 201 when onboarding succeeds', async () => {
    const suffix = `${Date.now()}`;
    const res = await request(app).post('/api/vendors/onboard').send(onboardPayload(suffix));
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.vendor).toBeDefined();
    expect(res.body.data?.user).toBeDefined();
  });
});

describe('POST /api/vendors/onboard/existing', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/vendors/onboard/existing')
      .send({
        firstName: 'A',
        lastName: 'B',
        businessName: 'C',
        nin: '11111111111',
        phoneNumber: '080',
      });
    expect(res.status).toBe(401);
  });

  it('returns 201 when authenticated user without vendor profile onboards (route does not require isVendor)', async () => {
    const user = await createVerifiedUser({ email: `nov-${Date.now()}@test.com` });
    const token = signAccessToken(user);
    const nin = `4${`${Date.now()}`.slice(-10)}`;
    const res = await request(app)
      .post('/api/vendors/onboard/existing')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'A',
        lastName: 'B',
        businessName: 'Existing Biz',
        nin,
        phoneNumber: '+2348000000001',
      });
    expect(res.status).toBe(201);
    expect(res.body.data?.vendor?.businessName).toBe('Existing Biz');
  });
});

describe('Vendor protected routes', () => {
  it('GET /api/vendors/profile returns 403 for buyer (no vendor profile)', async () => {
    const user = await createVerifiedUser();
    const token = signAccessToken(user);
    const res = await request(app)
      .get('/api/vendors/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/vendors/profile returns 200 for vendor', async () => {
    const user = await createVerifiedUser({ email: `vp-${Date.now()}@test.com` });
    await createVendorForUser(user);
    const token = signAccessToken(user);
    const res = await request(app)
      .get('/api/vendors/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.businessName).toBe('Test Biz');
  });

  it('PATCH /api/vendors/bank-details validates body', async () => {
    const user = await createVerifiedUser({ email: `bank-${Date.now()}@test.com` });
    await createVendorForUser(user);
    const token = signAccessToken(user);
    const res = await request(app)
      .patch('/api/vendors/bank-details')
      .set('Authorization', `Bearer ${token}`)
      .send({ accountName: '' });
    expect(res.status).toBe(422);
  });

  it('PATCH /api/vendors/bank-details updates details', async () => {
    const user = await createVerifiedUser({ email: `bank2-${Date.now()}@test.com` });
    await createVendorForUser(user);
    const token = signAccessToken(user);
    const res = await request(app)
      .patch('/api/vendors/bank-details')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountName: 'Acct Name',
        bankName: 'Test Bank',
        accountNumber: '0123456789',
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Bank details updated/i);
  });

  it('GET /api/vendors/products returns 200', async () => {
    const user = await createVerifiedUser({ email: `prodlist-${Date.now()}@test.com` });
    await createVendorForUser(user);
    const token = signAccessToken(user);
    const res = await request(app)
      .get('/api/vendors/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/vendors/orders returns 200', async () => {
    const user = await createVerifiedUser({ email: `ordlist-${Date.now()}@test.com` });
    await createVendorForUser(user);
    const token = signAccessToken(user);
    const res = await request(app)
      .get('/api/vendors/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/vendors/balance returns 200', async () => {
    const user = await createVerifiedUser({ email: `bal-${Date.now()}@test.com` });
    await createVendorForUser(user);
    const token = signAccessToken(user);
    const res = await request(app)
      .get('/api/vendors/balance')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/vendors/:id returns 404 when vendor missing', async () => {
    const user = await createVerifiedUser({ email: `pub-${Date.now()}@test.com` });
    await createVendorForUser(user);
    const token = signAccessToken(user);
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .get(`/api/vendors/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Vendor not found/i);
  });

  it('GET /api/vendors/:id returns vendor when id exists', async () => {
    const user = await createVerifiedUser({ email: `pub2-${Date.now()}@test.com` });
    const v = await createVendorForUser(user);
    const token = signAccessToken(user);
    const res = await request(app)
      .get(`/api/vendors/${v._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.businessName).toBe('Test Biz');
  });
});
