export enum NotificationCategoryEnum {
  AUTH = 'auth',
  ORDER = 'order',
  PAYMENT = 'payment',
  TRANSACTION = 'transaction',
  ESCROW = 'escrow',
  GENERAL = 'general'
}

export interface NotificationFilters {
  category?: NotificationCategoryEnum;
  read?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  order?: 'newest' | 'oldest';
}