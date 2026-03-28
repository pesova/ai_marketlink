export const CANCEL_KEYWORDS = [
  'cancel',
  'stop',
  'reset',
  'start over',
  'restart',
  'quit',
  'exit',
  'menu',
  'back',
  'clear',
];

export const CONFIRM_DELIVERY_KEYWORDS = ['confirm', 'received', 'delivered', 'done'];

export const STATUS_KEYWORDS = ['status', 'order status', 'my order', 'track'];

export const VENDOR_KEYWORDS = ['vendor', 'vendor menu', 'my store', 'sell'];

export function isCancelMessage(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return CANCEL_KEYWORDS.some((k) => lower.includes(k));
}

export function isStatusMessage(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return STATUS_KEYWORDS.some((k) => lower.includes(k));
}

export function isConfirmDeliveryMessage(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return CONFIRM_DELIVERY_KEYWORDS.some((k) => lower.includes(k));
}

export function isVendorMenuMessage(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return VENDOR_KEYWORDS.some((k) => lower.includes(k));
}