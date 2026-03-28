import request from 'supertest';
import app from '../src/app';

describe('Global error handler', () => {
  it('returns 422 for validation errors from controllers', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad-email' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('returns 500 for cast errors caught in productController (invalid ObjectId)', async () => {
    const res = await request(app).get('/api/products/not-a-valid-object-id');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(String(res.body.message).length).toBeGreaterThan(0);
  });

  it('propagates thrown errors from services as 500', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'missing@test.com', token: '123456' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('CastError path', () => {
  it('mongoose CastError is mapped to 400 by error handler', async () => {
    const err: any = new Error('bad');
    err.name = 'CastError';
    err.path = '_id';
    err.value = 'bad-id';

    const { errorHandler } = await import('../src/utils/errorHandler');
    const req: any = { method: 'GET', originalUrl: '/x' };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Invalid'),
      }),
    );
  });
});
