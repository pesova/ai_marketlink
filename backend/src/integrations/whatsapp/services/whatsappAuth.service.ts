import { User } from '../../../models';
import { redisClient } from '../../../utils/redisClient';

/**
 * Helper utilities for WhatsApp integration.
 * - Normalises phone numbers (+234XXXXXXXXX)
 * - Looks up a user by phone
 * - Stores / retrieves session state in Redis (fallback to in‑memory Map)
 */
interface WhatsAppSession {
  phoneNumber: string;
  userId?: string;
  vendorId?: string;
  role: 'buyer' | 'vendor' | 'unknown';
  step: string; //
  searchResults?: any[];
  selectedProduct?: any;
  currentOrderId?: string;
  lastActivity: string; // ISO timestamp
}

class WhatsAppAuthService {
  private map = new Map<string, WhatsAppSession>();
  private ttlSeconds = 1800; // 30 min

  normalizePhone(raw: string): string {
    // Remove spaces, dashes, and ensure +234 prefix
    let phone = raw.replace(/[^0-9+]/g, '');
    if (!phone.startsWith('+')) phone = `+${phone}`;
    if (!phone.startsWith('+234')) {
      // assume local Nigerian number without country code
      phone = `+234${phone.replace(/^0/, '')}`;
    }
    return phone;
  }

  async findUserByPhone(phone: string) {
    const normalized = this.normalizePhone(phone);
    return User.findOne({ phoneNumber: normalized }).lean();
  }

  async getSession(phone: string): Promise<WhatsAppSession> {
    const key = `whatsapp:ctx:${phone}`;
    // Try Redis first
    const cached = await redisClient.get(key);
    
    if (cached) {
      const session: WhatsAppSession = JSON.parse(cached);
      // refresh TTL
      await redisClient.expire(key, this.ttlSeconds);
      return session;
    }
    // Fallback to in‑memory map
    let session = this.map.get(phone);
    if (!session) {
      session = {
        phoneNumber: phone,
        role: 'unknown',
        step: 'GREETING',
        lastActivity: new Date().toISOString(),
      } as WhatsAppSession;
      this.map.set(phone, session);
    }
    return session;
  }

  async saveSession(session: WhatsAppSession): Promise<void> {
    const key = `whatsapp:ctx:${session.phoneNumber}`;
    const payload = JSON.stringify(session);
    await redisClient.setex(key, this.ttlSeconds, payload);
    this.map.set(session.phoneNumber, session);
  }
}

export default new WhatsAppAuthService();