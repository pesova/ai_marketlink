import crypto from 'crypto';
import { redisClient } from '../utils/redisClient';

const STATE_PREFIX = 'oauth:state:';
const CODE_PREFIX = 'oauth:code:';
const STATE_TTL_SECONDS = 600;
const CODE_TTL_SECONDS = 60;

class GoogleOAuthStore {
  async storeStateNonce(nonce: string): Promise<void> {
    await redisClient.setex(`${STATE_PREFIX}${nonce}`, STATE_TTL_SECONDS, '1');
  }

  async consumeStateNonce(nonce: string): Promise<boolean> {
    const key = `${STATE_PREFIX}${nonce}`;
    const value = await redisClient.get(key);
    if (!value) return false;
    await redisClient.del(key);
    return true;
  }

  async createExchangeCode(userId: string): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    await redisClient.setex(`${CODE_PREFIX}${code}`, CODE_TTL_SECONDS, userId);
    return code;
  }

  async consumeExchangeCode(code: string): Promise<string | null> {
    const key = `${CODE_PREFIX}${code}`;
    const userId = await redisClient.get(key);
    if (!userId) return null;
    await redisClient.del(key);
    return userId;
  }
}

export default new GoogleOAuthStore();
