export enum WebhookTransactionEvent {
  CREATED = 'TRANSACTION.CREATED',
  UPDATED = 'TRANSACTION.UPDATED',
  COMPLETED = 'TRANSACTION.COMPLETED',
}

export interface TransactionWebhookData {
  remittanceAmount: number;
  bankCode: string;
  amount: number;
  paymentReference: string;
  channel: string;
  splitAccounts: any[];
  retrievalReferenceNumber: string;
  transactionDate: number;
  accountNumber: string | null;
  responseCode: string;
  token: string | null;
  responseDescription: string;
  paymentId: number;
  merchantCustomerId: string;
  escrow: boolean;
  merchantReference: string;
  currencyCode: string;
  merchantCustomerName: string | null;
  cardNumber: string;
}

export interface TransactionWebhookPayload {
  event: WebhookTransactionEvent;
  uuid: string;
  timestamp: number;
  data: TransactionWebhookData;
}