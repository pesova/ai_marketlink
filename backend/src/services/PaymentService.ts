import EscrowService from './EscrowService';
import { Order, OrderStatus } from '../models/Order';
import InterswitchProvider from './api/InterswitchProvider';

class PaymentService {
  /**
   * Initiate payment for an order.
   *
   * Flow:
   *   1. Validate order is PENDING_PAYMENT and belongs to buyer
   *   2. Call Interswitch pay-bill API to create a payment link
   *   3. Save the Interswitch `reference` on the order so we can look it up in the webhook
   *   4. Return the paymentUrl — frontend redirects buyer there
   */
  public async initiatePayment(
    orderId: string,
    buyerId: string,
    buyerEmail: string
  ) {
    const order = await Order.findById(orderId);
    
    if (!order) throw new Error('Order not found');
    if (order.buyer.toString() !== buyerId) throw new Error('Unauthorised');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new Error(`Order is not awaiting payment — current status: ${order.status}`);
    }

    const amountKobo = Math.round(order.totalAmount * 100);
    const payBillResponse = await InterswitchProvider.createPaymentLink(
      amountKobo,
      buyerEmail
    );
    // Store Interswitch references on order for webhook lookup
    order.interswitchRef = payBillResponse.reference;
    order.interswitchTransactionRef = payBillResponse.transactionReference;
    await order.save();
    // Initiate escrow record with status INITIATED
    await EscrowService.initiateEscrow({
      orderId: order._id.toString(),
      buyerId: buyerId,
      vendorId: order.vendor.toString(),
      amount: amountKobo,
      interswitchRef: payBillResponse.transactionReference,
    });
    return {
      paymentUrl:       payBillResponse.paymentUrl,
      interswitchRef:   payBillResponse.reference,
      transactionRef:   payBillResponse.transactionReference,
      amountKobo,
      orderId,
    };
  }

  /**
   * Process the redirect/webhook after buyer completes (or abandons) payment.
   *
   * Interswitch sends the buyer back to your redirectUrl with a `txnref` query param.
   * This method:
   *   1. Finds the order by the Interswitch reference
   *   2. Re-queries Interswitch to confirm payment is genuine
   *   3. Verifies responseCode === '00' and amount matches
   *   4. Creates the escrow record and moves order to PAID_IN_ESCROW
   *
   * Idempotent — safe to call multiple times for the same reference.
   */
  public async processWebhook(interswitchRef: string) {
    const order = await Order.findOne({
      $or: [
        { interswitchRef: interswitchRef },
        { interswitchTransactionRef: interswitchRef }
      ],
      status: OrderStatus.PENDING_PAYMENT,
    });

    if (!order) {
      console.error(`PaymentService.processWebhook: no pending order found for ref ${interswitchRef}`);
      return { success: false, message: 'No pending order found for this reference' };
    }

    const amountKobo = Math.round(order.totalAmount * 100);
    const verifyRef = order.interswitchTransactionRef || interswitchRef;

    // Re-verify with Interswitch — never trust the redirect params alone
    let statusResult;
    try {
      statusResult = await InterswitchProvider.verifyTransaction(verifyRef, amountKobo);
    } catch (err: any) {
      console.error(`PaymentService: verification failed for ${interswitchRef}:`, err.message);
      return { success: false, message: 'Could not verify transaction with Interswitch' };
    }

    if (statusResult.responseCode !== '00') {
      console.warn(
        `PaymentService: payment not successful for ${interswitchRef} — code ${statusResult.responseCode}: ${statusResult.responseDescription}`
      );
      return {
        success: false,
        message: `Payment not confirmed: ${statusResult.responseDescription}`,
      };
    }

    // Amount guard — prevent under-payment
    if (statusResult.amount !== amountKobo) {
      console.error(
        `PaymentService: amount mismatch for ${interswitchRef} — expected ${amountKobo}, got ${statusResult.amount}`
      );
      return { success: false, message: 'Payment amount mismatch' };
    }

    // Finalize escrow after successful verification (lookup key is Interswitch txn ref, not Mongo order id)
    await EscrowService.resolveAndFinalize(verifyRef, statusResult.paymentReference);

    return {
      success:       true,
      orderId:       order._id.toString(),
      interswitchRef,
      amountNaira:   order.totalAmount,
    };
  }
}

export default new PaymentService();