import { Order, OrderStatus } from '../models/Order';
import InterswitchProvider from './api/InterswitchProvider';
import EscrowService from './EscrowService';

export type VerifyOrderPaymentResult =
  | { finalized: true; orderId: string; totalAmount: number }
  | { finalized: false; reason: string; responseCode?: string };

/**
 * Re-verify Interswitch and finalize escrow when payment succeeded.
 * Idempotent if order is already past PENDING_PAYMENT or escrow already finalized.
 */
export async function verifyInterswitchAndFinalizeOrder(
  orderId: string,
): Promise<VerifyOrderPaymentResult> {
  const order = await Order.findById(orderId);
  if (!order) {
    return { finalized: false, reason: 'order_not_found' };
  }
  if (order.status !== OrderStatus.PENDING_PAYMENT) {
    return { finalized: false, reason: 'not_pending_payment' };
  }

  const verifyRef = order.interswitchTransactionRef || order.interswitchRef;
  if (!verifyRef) {
    return { finalized: false, reason: 'no_interswitch_ref' };
  }

  const amountKobo = Math.round(order.totalAmount * 100);
  let statusResult;
  try {
    statusResult = await InterswitchProvider.verifyTransaction(
      verifyRef,
      amountKobo,
    );
  } catch {
    return { finalized: false, reason: 'verify_request_failed' };
  }

  if (statusResult.responseCode !== '00') {
    return {
      finalized: false,
      reason: 'not_paid',
      responseCode: statusResult.responseCode,
    };
  }

  if (statusResult.amount !== amountKobo) {
    return { finalized: false, reason: 'amount_mismatch' };
  }

  await EscrowService.resolveAndFinalize(verifyRef, statusResult.paymentReference);

  const after = await Order.findById(orderId);
  if (after?.status === OrderStatus.PENDING_PAYMENT) {
    return { finalized: false, reason: 'finalize_noop' };
  }

  return {
    finalized: true,
    orderId: order._id.toString(),
    totalAmount: order.totalAmount,
  };
}
