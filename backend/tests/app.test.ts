import request from 'supertest';
import app from '../src/app';

describe('App bootstrap & global handlers', () => {
  describe('GET /', () => {
    it('returns API running message', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'AI MarketLink API is running!' });
    });
  });

  describe('GET /api/health', () => {
    it('returns healthy payload with ISO timestamp', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is healthy');
      expect(typeof res.body.timestamp).toBe('string');
      expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
    });
  });

  describe('Unknown routes', () => {
    it('returns 404 JSON for non-existent API path', async () => {
      const res = await request(app).get('/api/does-not-exist-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('/api/does-not-exist-xyz');
      expect(res.body.message).toContain('not found');
    });
  });
});
