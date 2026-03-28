import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { User } from '../src/models/User';
import { PasswordReset } from '../src/models/PasswordReset';
import {
  createVerifiedUser,
  createUnverifiedUser,
  signAccessToken,
} from './helpers/seed';

describe('POST /api/auth/register', () => {
  it('returns 422 when validation fails (missing email)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'A',
      password: 'secret1',
      confirmPassword: 'secret1',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('returns 422 when passwords do not match', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Valid Name',
      email: 'newuser@test.com',
      password: 'secret1',
      confirmPassword: 'secret2',
    });
    expect(res.status).toBe(422);
    const confirmErr = res.body.errors?.find((e: { field: string }) => e.field === 'confirmPassword');
    expect(confirmErr).toBeDefined();
  });

  it('returns 201 and success message on valid registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Valid User',
      email: `reg-${Date.now()}@test.com`,
      password: 'secret12',
      confirmPassword: 'secret12',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Verification');
  });
});

describe('POST /api/auth/login', () => {
  it('returns 422 when body is invalid', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.errors?.length).toBeGreaterThan(0);
  });

  it('returns 500 with invalid credentials message when user missing', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com',
      password: 'wrong',
    });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid credentials/i);
  });

  it('returns 500 when email not verified', async () => {
    const u = await createUnverifiedUser();
    const res = await request(app).post('/api/auth/login').send({
      email: u.email,
      password: 'Password123!',
    });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  it('returns 200 with token for verified user', async () => {
    const u = await createVerifiedUser({ email: `login-${Date.now()}@test.com` });
    const res = await request(app).post('/api/auth/login').send({
      email: u.email,
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.access_token).toBeDefined();
    expect(res.body.data?.user?.email).toBe(u.email);
  });
});

describe('GET /api/auth/profile', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/No token/i);
  });

  it('returns 403 for malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Invalid token/i);
  });

  it('returns 200 with user when token valid', async () => {
    const u = await createVerifiedUser();
    const token = signAccessToken(u);
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.user?.email).toBe(u.email);
  });
});

describe('POST /api/auth/verify-email', () => {
  it('returns 422 for invalid token length', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({
      email: 'a@test.com',
      token: '12',
    });
    expect(res.status).toBe(422);
  });

  it('returns 500 when user not found', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({
      email: 'missing@test.com',
      token: '123456',
    });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/User not found/i);
  });
});

describe('POST /api/auth/resend-verification', () => {
  it('returns 422 for invalid email', async () => {
    const res = await request(app).post('/api/auth/resend-verification').send({ email: 'bad' });
    expect(res.status).toBe(422);
  });

  it('returns 500 when user not found', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'ghost@test.com' });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/User not found/i);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('returns 422 for invalid email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'x' });
    expect(res.status).toBe(422);
  });

  it('returns 200 with generic message when user does not exist', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'nonexistent@test.com',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/If this email exists/i);
  });
});

describe('POST /api/auth/verify-reset-token', () => {
  it('returns 422 when token invalid', async () => {
    const res = await request(app).post('/api/auth/verify-reset-token').send({
      email: 'a@test.com',
      token: 'abc',
    });
    expect(res.status).toBe(422);
  });

  it('returns 500 when reset record missing', async () => {
    const res = await request(app).post('/api/auth/verify-reset-token').send({
      email: 'user@test.com',
      token: '123456',
    });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/Invalid or expired reset code/i);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('returns 422 when passwords mismatch', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'a@test.com',
      token: '123456',
      newPassword: 'newpass1',
      confirmPassword: 'newpass2',
    });
    expect(res.status).toBe(422);
  });

  it('resets password when token valid', async () => {
    const u = await createVerifiedUser({ email: `reset-${Date.now()}@test.com` });
    await PasswordReset.create({
      email: u.email,
      token: '654321',
      expiresAt: new Date(Date.now() + 3600000),
    });

    const res = await request(app).post('/api/auth/reset-password').send({
      email: u.email,
      token: '654321',
      newPassword: 'newpass12',
      confirmPassword: 'newpass12',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await User.findOne({ email: u.email }).select('+password');
    expect(updated).toBeTruthy();
    const ok = await bcrypt.compare('newpass12', updated!.password);
    expect(ok).toBe(true);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 without authentication', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Logged out/i);
  });
});
