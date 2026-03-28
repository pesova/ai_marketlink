import { Request, Response } from 'express';
import PaymentService from '../services/PaymentService';
import InterswitchProvider from '../services/api/InterswitchProvider';
import EscrowService from '../services/EscrowService';

/**
 * POST /api/payments/initiate
 * Buyer calls this to get an Interswitch checkout URL for their order.
 *
 * Body: { orderId: string }
 */
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const user = (req as any).user;

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const result = await PaymentService.initiatePayment(
      orderId,
      user._id.toString(),
      user.email
    );

    res.status(200).json({
      success: true,
      message: 'Payment link created. Redirect buyer to paymentUrl to complete payment.',
      data: result,
    });
  } catch (error: any) {
    throw error;
  }
};

/**
 * GET /api/payments/escrow/:orderId
 * Get the escrow record for a specific order.
 * Buyer or vendor can call this to see escrow status.
 */
export const getEscrowByOrder = async (req: Request, res: Response) => {
  try {
    const escrow = await EscrowService.getByOrderId(req.params.orderId as string);
    if (!escrow) {
      return res.status(404).json({ success: false, message: 'No escrow record found for this order' });
    }

    res.status(200).json({
      success: true,
      data: escrow,
    });
  } catch (error: any) {
    throw error;
  }
};

/**
 * GET /api/payments/status?reference=...&amount=...
 * Manually check transaction status.
 */
export const checkTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'reference is required' });
    }
    const escrowRecord = await (await import('../models/EscrowTransaction')).EscrowTransaction.findOne({ interswitchRef: reference as string });
    if (!escrowRecord) {
      return res.status(404).json({ success: false, message: 'Escrow not found for given reference' });
    }
    const amountKobo = escrowRecord.amount;
    const result = await InterswitchProvider.verifyTransaction(reference as string, amountKobo);
    if (result.responseCode === '00') {
      await EscrowService.resolveAndFinalize(
        escrowRecord.interswitchRef,
        result.paymentReference,
      );
    }
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('checkTransactionStatus error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};