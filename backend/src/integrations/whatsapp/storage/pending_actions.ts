import { redisClient } from "../../../utils/redisClient";

const PREFIX = 'wa:pending:';
const SESSION_PREFIX = 'wa:session:';
const TTL = 3600; // 1 hour

export interface WhatsAppSession {
  phoneNumber: string;
  userId?: string;
  email?: string;
  vendorId?: string;
  role: 'buyer' | 'vendor' | 'unknown';
  step: ConversationStep;
  searchResults?: any[];
  selectedProduct?: any;
  currentOrderId?: string;
  lastActivity: string;
}

export type ConversationStep =
  | 'AWAITING_INTENT'
  | 'AWAITING_SELECTION'
  | 'AWAITING_DELIVERY_ADDRESS'
  | 'ORDER_CREATED'
  | 'VENDOR_MENU'
  | 'VENDOR_AWAITING_SHIP_ID'
  | 'VENDOR_AWAITING_DELIVERED_ID';

export interface PendingAction {
  type: 'PRODUCT_SELECTION' | 'DELIVERY_ADDRESS' | 'VENDOR_ACTION';
  payload?: Record<string, any>;
  createdAt?: string;
}

export async function getSession(phone: string): Promise<WhatsAppSession> {
  const key = `${SESSION_PREFIX}${phone}`;
  const data = await redisClient.get(key);
  if (data) return JSON.parse(data);

  return {
    phoneNumber: phone,
    role: 'unknown',
    step: 'AWAITING_INTENT',
    lastActivity: new Date().toISOString(),
  };
}

export async function saveSession(session: WhatsAppSession): Promise<void> {
  const key = `${SESSION_PREFIX}${session.phoneNumber}`;
  session.lastActivity = new Date().toISOString();
  await redisClient.setex(key, TTL, JSON.stringify(session));
}

export async function clearSession(phone: string): Promise<void> {
  await redisClient.del(`${SESSION_PREFIX}${phone}`);
}

export async function savePendingAction(
  phone: string,
  action: PendingAction,
): Promise<void> {
  const key = `${PREFIX}${phone}`;
  if (!action.createdAt) action.createdAt = new Date().toISOString();
  await redisClient.setex(key, TTL, JSON.stringify(action));
}

export async function getPendingAction(
  phone: string,
): Promise<PendingAction | null> {
  const key = `${PREFIX}${phone}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

export async function clearPendingAction(phone: string): Promise<void> {
  await redisClient.del(`${PREFIX}${phone}`);
}

export async function resetUserState(phone: string): Promise<void> {
  await Promise.all([clearSession(phone), clearPendingAction(phone)]);
}