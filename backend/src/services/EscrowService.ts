import { Types } from "mongoose";
import { EscrowTransaction, EscrowStatus } from "../models/EscrowTransaction";
import { Order, OrderStatus } from "../models/Order";
import env from "../config/env";
import NotificationService from "./NotificationService";
import { NotificationCategoryEnum } from "../interfaces/INotification";
import { IVendor } from "../models";
import { PopulatedOrder } from "../interfaces/IEscrow";


class EscrowService {
  /**
   * Lock funds in escrow after successful payment.
   * Creates an EscrowTransaction and moves the Order to PAID_IN_ESCROW.
   */
  public async createForOrder(params: {
    orderId: string;
    buyerId: string;
    vendorId: string;
    amount: number;
    interswitchRef: string;
    interswitchPaymentId?: string;
  }): Promise<void> {
    const {
      orderId,
      buyerId,
      vendorId,
      amount,
      interswitchRef,
      interswitchPaymentId,
    } = params;

    // Guard: don't double-create escrow for the same transaction ref
    const existing = await EscrowTransaction.findOne({ interswitchRef });
    if (existing) {
      return;
    }

    await EscrowTransaction.create({
      order: new Types.ObjectId(orderId),
      buyer: new Types.ObjectId(buyerId),
      vendor: new Types.ObjectId(vendorId),
      amount,
      status: EscrowStatus.HOLDING,
      interswitchRef,
      interswitchPaymentId,
    });

    // Move order to PAID_IN_ESCROW
    await Order.findByIdAndUpdate(orderId, {
      status: OrderStatus.PAID_IN_ESCROW,
    });
  }
  /**
   * Initiate an escrow record when payment link is created.
   * Sets status to INITIATED and stores the Interswitch reference.
   */
  public async initiateEscrow(params: {
    orderId: string;
    buyerId: string;
    vendorId: string;
    amount: number;
    interswitchRef: string;
  }): Promise<void> {
    const { orderId, buyerId, vendorId, amount, interswitchRef } = params;
    const existing = await EscrowTransaction.findOne({ interswitchRef });
    if (existing) {
      return;
    }
    await EscrowTransaction.create({
      order: new Types.ObjectId(orderId),
      buyer: new Types.ObjectId(buyerId),
      vendor: new Types.ObjectId(vendorId),
      amount,
      status: EscrowStatus.INITIATED,
      interswitchRef,
    });
  }

  /**
   * Finalize escrow after successful payment verification.
   * Moves escrow from INITIATED to HOLDING and updates order status.
   */
  public async finalizeEscrow(
    interswitchRef: string,
    interswitchPaymentId?: string,
  ): Promise<void> {
    const escrow = await EscrowTransaction.findOne({
      interswitchRef,
      status: EscrowStatus.INITIATED,
    });

    if (!escrow) {
      return;
    }

    const order = await Order.findByIdAndUpdate(
      escrow.order,
      { status: OrderStatus.PAID_IN_ESCROW },
      { new: true },
    )
      .populate<{ buyer: { _id: any; email: string; name: string } }>(
        "buyer",
        "name email",
      )
      .populate({
        path: "vendor",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate("product", "name");

    const typedOrder = order as unknown as PopulatedOrder;

    escrow.status = EscrowStatus.HOLDING;
    if (interswitchPaymentId)
      escrow.interswitchPaymentId = interswitchPaymentId;
    await escrow.save();
    if (!order) {
      return;
    }
    await NotificationService.setTo({
      userId: order.buyer._id,
      email: order.buyer.email,
    })
      .setSubject("Payment Successful – Escrow Secured")
      .setMessage(
        `Your payment of ₦${order.totalAmount} has been secured in escrow. We will release it once the order is completed.`,
      )
      .setCategory(NotificationCategoryEnum.TRANSACTION)
      .setDetails({
        orderId: order._id,
        amount: order.totalAmount,
      })
      .sendBoth();

    const vendorUserId = typedOrder.vendor?.user?._id;
    const vendorEmail = typedOrder.vendor?.user?.email;
    if (vendorUserId) {
      await NotificationService.setTo({
        userId: vendorUserId,
        email: vendorEmail,
      })
        .setSubject("New Order Ready for Shipment")
        .setMessage(
          `You have received payment for order ${order._id}. Please proceed to ship the product.`,
        )
        .setCategory(NotificationCategoryEnum.TRANSACTION)
        .setDetails({
          orderId: order._id,
          product: order.product,
        })
        .sendBoth();
    }
  }

  /**
   * Finalize escrow when the gateway reference may be either pay-bill `reference`
   * or `transactionReference` (stored on the escrow row).
   */
  public async resolveAndFinalize(
    referenceFromGateway: string,
    interswitchPaymentId?: string,
  ): Promise<void> {
    const direct = await EscrowTransaction.findOne({
      interswitchRef: referenceFromGateway,
      status: EscrowStatus.INITIATED,
    });
    if (direct) {
      await this.finalizeEscrow(referenceFromGateway, interswitchPaymentId);
      return;
    }
    const order = await Order.findOne({
      $or: [
        { interswitchRef: referenceFromGateway },
        { interswitchTransactionRef: referenceFromGateway },
      ],
    });
    const resolved =
      order?.interswitchTransactionRef || order?.interswitchRef;
    if (!resolved) {
      return;
    }
    await this.finalizeEscrow(resolved, interswitchPaymentId);
  }

  /** Remove INITIATED ledger rows when the buyer cancels before completing payment. */
  public async voidInitiatedForOrder(orderId: string): Promise<void> {
    await EscrowTransaction.deleteMany({
      order: new Types.ObjectId(orderId),
      status: EscrowStatus.INITIATED,
    });
  }

  /**
   * Auto-release escrow for orders stuck in DELIVERED_PENDING_CONFIRMATION
   * past ESCROW_AUTO_RELEASE_DAYS (buyer never confirmed).
   */
  public async autoReleaseStalePendingBuyerConfirmation(): Promise<number> {
    const days = env.ESCROW_AUTO_RELEASE_DAYS;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const stale = await Order.find({
      status: OrderStatus.DELIVERED_PENDING_CONFIRMATION,
      pendingBuyerConfirmationAt: { $exists: true, $lte: cutoff },
    });
    let count = 0;
    for (const o of stale) {
      try {
        await this.releaseForOrder(o._id.toString());
        count++;
      } catch (err) {
        console.error(
          "[escrow] auto-release failed for order",
          o._id.toString(),
          err,
        );
      }
    }
    return count;
  }

  public async releaseForOrder(orderId: string): Promise<void> {
    const escrow = await EscrowTransaction.findOne({
      order: new Types.ObjectId(orderId),
      status: EscrowStatus.HOLDING,
    });

    if (!escrow) {
      throw new Error(`No active escrow found for order ${orderId}`);
    }

    escrow.status = EscrowStatus.RELEASED;
    escrow.releasedAt = new Date();
    await escrow.save();

    await Order.findByIdAndUpdate(orderId, {
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
    });

  }

  public async refundForOrder(orderId: string): Promise<void> {
    const escrow = await EscrowTransaction.findOne({
      order: new Types.ObjectId(orderId),
      status: EscrowStatus.HOLDING,
    });

    if (!escrow) {
      throw new Error(`No active escrow found for order ${orderId}`);
    }

    escrow.status = EscrowStatus.REFUNDED;
    escrow.refundedAt = new Date();
    await escrow.save();
  }

  /**
   * Get escrow record for an order (for admin / vendor balance views).
   */
  public async getByOrderId(orderId: string) {
    return EscrowTransaction.find({ order: new Types.ObjectId(orderId) });
  }

  /**
   * Get total funds currently held in escrow for a vendor.
   * Used by the vendor balance endpoint.
   */
  public async getVendorEscrowBalance(vendorId: string): Promise<number> {
    const result = await EscrowTransaction.aggregate([
      {
        $match: {
          vendor: new Types.ObjectId(vendorId),
          status: EscrowStatus.HOLDING,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Amount stored in kobo — return in naira
    return result.length > 0 ? result[0].total / 100 : 0;
  }

  /**
   * Get total released (available) funds for a vendor.
   * "Available" = released funds not yet paid out to vendor's bank.
   */
  public async getVendorAvailableBalance(vendorId: string): Promise<number> {
    const result = await EscrowTransaction.aggregate([
      {
        $match: {
          vendor: new Types.ObjectId(vendorId),
          status: EscrowStatus.RELEASED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return result.length > 0 ? result[0].total / 100 : 0;
  }
}

export default new EscrowService();
