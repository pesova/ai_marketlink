import request from 'supertest';
import ChatService from '../src/services/ChatService';
import app from '../src/app';
import { createVerifiedUser, signAccessToken } from './helpers/seed';

describe('/api/chat', () => {
  it('returns 401 without token for POST', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'Hi' });
    expect(res.status).toBe(401);
  });

  it('POST /api/chat validates message and calls ChatService', async () => {
    const user = await createVerifiedUser({ email: `chat-${Date.now()}@test.com` });
    const token = signAccessToken(user);
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello assistant' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.reply).toBe('Mock assistant reply');
    expect(ChatService.chat).toHaveBeenCalled();
  });

  it('returns 422 when message empty', async () => {
    const user = await createVerifiedUser({ email: `chat2-${Date.now()}@test.com` });
    const token = signAccessToken(user);
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '' });
    expect(res.status).toBe(422);
  });

  it('GET /api/chat returns history', async () => {
    const user = await createVerifiedUser({ email: `chat3-${Date.now()}@test.com` });
    const token = signAccessToken(user);
    const res = await request(app).get('/api/chat').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(ChatService.getHistory).toHaveBeenCalled();
  });

  it('DELETE /api/chat/history clears history', async () => {
    const user = await createVerifiedUser({ email: `chat4-${Date.now()}@test.com` });
    const token = signAccessToken(user);
    const res = await request(app)
      .delete('/api/chat/history')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cleared/i);
    expect(ChatService.clearHistory).toHaveBeenCalled();
  });
});
