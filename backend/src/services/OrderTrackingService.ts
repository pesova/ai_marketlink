import { Order, OrderStatus } from '../models/Order';
import { redisClient } from '../utils/redisClient';
import { sendTextMessage } from '../integrations/whatsapp/services/whatsapp.service';
import whatsappAuthService from '../integrations/whatsapp/services/whatsappAuth.service';
import { verifyInterswitchAndFinalizeOrder } from './paymentOrderVerify';

const ORDER_TRACKING_KEY_PREFIX = 'order_tracking:';
const ACTIVE_ORDERS_KEY = `${ORDER_TRACKING_KEY_PREFIX}active_orders`;
const BY_ORDER_PREFIX = `${ORDER_TRACKING_KEY_PREFIX}by_order:`;
const TTL_SECONDS = 86400;

export interface WaOrderTrackingPayload {
  phone: string;
  orderId: string;
  transactionRef: string;
  amountKobo: number;
  orderStatus: OrderStatus;
  startedAt: string;
  lastCheckedAt: string;
  lastPaymentCheckCode?: string;
}

class OrderTrackingService {
  private getOrderKey(phone: string, orderId: string): string {
    return `${ORDER_TRACKING_KEY_PREFIX}${phone}:${orderId}`;
  }

  private getUserOrdersSetKey(phone: string): string {
    return `${ORDER_TRACKING_KEY_PREFIX}user:${phone}:list-orders`;
  }

  private byOrderKey(orderId: string): string {
    return `${BY_ORDER_PREFIX}${orderId}`;
  }

  /**
   * WhatsApp: after payment link is created, track by buyer's WhatsApp number (E.164).
   */
  public async startTrackingOrder(phone: string, orderId: string): Promise<void> {
    const normalized = whatsappAuthService.normalizePhone(phone);
    const order = await Order.findById(orderId).lean();
    if (!order) {
      console.warn(`[order-tracking] startTrackingOrder: order ${orderId} not found`);
      return;
    }
    const transactionRef =
      order.interswitchTransactionRef || order.interswitchRef;
    if (!transactionRef) {
      console.warn(`[order-tracking] startTrackingOrder: no Interswitch ref on ${orderId}`);
      return;
    }

    const amountKobo = Math.round(order.totalAmount * 100);
    const payload: WaOrderTrackingPayload = {
      phone: normalized,
      orderId,
      transactionRef,
      amountKobo,
      orderStatus: order.status as OrderStatus,
      startedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
    };

    const orderKey = this.getOrderKey(normalized, orderId);
    await redisClient.setex(orderKey, TTL_SECONDS, JSON.stringify(payload));
    await redisClient.setex(this.byOrderKey(orderId), TTL_SECONDS, normalized);

    await redisClient.sadd(this.getUserOrdersSetKey(normalized), orderId);
    await redisClient.expire(this.getUserOrdersSetKey(normalized), TTL_SECONDS);

    await redisClient.sadd(ACTIVE_ORDERS_KEY, orderId);
    await redisClient.expire(ACTIVE_ORDERS_KEY, TTL_SECONDS);

    console.log(`[order-tracking] started ${orderId} for ${normalized}`);
  }

  public async stopTrackingOrder(phone: string, orderId: string): Promise<void> {
    const normalized = whatsappAuthService.normalizePhone(phone);
    await redisClient.del(this.getOrderKey(normalized, orderId));
    await redisClient.del(this.byOrderKey(orderId));
    await redisClient.srem(this.getUserOrdersSetKey(normalized), orderId);
    await redisClient.srem(ACTIVE_ORDERS_KEY, orderId);
  }

  /** Returns WhatsApp phone if this order was tracked (before removing). */
  public async stopTrackingByOrderId(orderId: string): Promise<string | undefined> {
    const phone = await redisClient.get(this.byOrderKey(orderId));
    if (!phone) return undefined;
    await this.stopTrackingOrder(phone, orderId);
    return phone;
  }

  public async sendPaymentReceivedWhatsApp(
    phone: string,
    orderId: string,
    totalAmount: number,
  ): Promise<void> {
    const normalized = whatsappAuthService.normalizePhone(phone);
    const order = await Order.findById(orderId)
      .populate<{ product: { name?: string } }>('product', 'name')
      .lean();
    const productName =
      order?.product && typeof order.product === 'object' && order.product.name
        ? order.product.name
        : 'your order';

    await sendTextMessage(
      normalized,
      `✅ *Payment received!*\n\n` +
        `Order #${order?.interswitchTransactionRef ?? order?.interswitchRef}\n` +
        `₦${Number(totalAmount).toLocaleString()} secured in escrow for ${productName}.\n\n` +
        `We'll keep you updated. Reply *status* anytime.`,
    );
  }

  private async sendStatusChangeNotification(
    phone: string,
    orderId: string,
    previous: OrderStatus,
    current: OrderStatus,
  ): Promise<void> {
    const normalized = whatsappAuthService.normalizePhone(phone);
    let shortId = orderId.slice(-6);
    let body = '';
    const order = await Order.findById(orderId)
    .populate<{ product: { name?: string } }>('product', 'name')
    .lean();
    shortId = order?.interswitchTransactionRef ?? order?.interswitchRef ?? '';

    switch (current) {
      case OrderStatus.PAID_IN_ESCROW:
        if (previous === OrderStatus.PENDING_PAYMENT) {
            const order = await Order.findById(orderId)
            .populate<{ product: { name?: string } }>('product', 'name')
            .lean();
          body =
            `✅ *Payment received!*\n\n` +
            `Order #${shortId}\n` +
            `₦${Number(order?.totalAmount ?? 0).toLocaleString()} secured in escrow for ${order?.product?.name ?? 'your order'}.\n\n` +
            `We'll keep you updated. Reply *status* anytime.`;
        }
        break;
      case OrderStatus.SHIPPED:
        body =
          `🚚 *Order shipped*\n\n` +
          `Order #${shortId}\n` +
          `Your package is on the way.`;
        break;
      case OrderStatus.DELIVERED_PENDING_CONFIRMATION:
        body =
          `📬 *Marked delivered*\n\n` +
          `Order #${shortId}\n` +
          `Please confirm receipt when you have it. Reply *confirm* when satisfied.`;
        break;
      case OrderStatus.COMPLETED:
        body =
          `🎉 *Order completed*\n\n` +
          `Order #${shortId}\n` +
          `Thank you for shopping on AI MarketLink!`;
        break;
      case OrderStatus.CANCELLED:
        body =
          `❌ *Order cancelled*\n\n` +
          `Order #${shortId}\n` +
          `This order is no longer active.`;
        break;
      default:
        break;
    }

    if (body) {
      await sendTextMessage(normalized, body);
    }
  }

  /** Poll tracked orders: verify payment if pending, detect DB status changes, WhatsApp buyer. */
  public async pollActiveOrders(): Promise<void> {
    const orderIds = await redisClient.smembers(ACTIVE_ORDERS_KEY);
    if (!orderIds.length) return;

    for (const orderId of orderIds) {
      try {
        const phone = await redisClient.get(this.byOrderKey(orderId));
        if (!phone) {
          await redisClient.srem(ACTIVE_ORDERS_KEY, orderId);
          continue;
        }

        const orderKey = this.getOrderKey(phone, orderId);
        const raw = await redisClient.get(orderKey);
        if (!raw) {
          await redisClient.srem(ACTIVE_ORDERS_KEY, orderId);
          continue;
        }

        let data = JSON.parse(raw) as WaOrderTrackingPayload;
        const previousStatus = data.orderStatus;

        let order = await Order.findById(orderId).lean();
        if (!order) {
          await this.stopTrackingOrder(phone, orderId);
          continue;
        }

        if (order.status === OrderStatus.PENDING_PAYMENT) {
          const payResult = await verifyInterswitchAndFinalizeOrder(orderId);
          if (!payResult.finalized) {
            data.lastPaymentCheckCode =
              payResult.responseCode ?? payResult.reason;
          }
          const reloaded = await Order.findById(orderId).lean();
          if (!reloaded) {
            await this.stopTrackingOrder(phone, orderId);
            continue;
          }
          order = reloaded;
        }

        const currentStatus = order.status as OrderStatus;
        if (currentStatus !== previousStatus) {
          console.log(
            `[order-tracking] ${orderId} status: ${previousStatus} -> ${currentStatus}`,
          );
          await this.sendStatusChangeNotification(
            phone,
            orderId,
            previousStatus,
            currentStatus,
          );
          data.orderStatus = currentStatus;
        }

        data.lastCheckedAt = new Date().toISOString();
        await redisClient.setex(orderKey, TTL_SECONDS, JSON.stringify(data));
        await redisClient.setex(this.byOrderKey(orderId), TTL_SECONDS, phone);
        await redisClient.expire(this.getUserOrdersSetKey(phone), TTL_SECONDS);
        await redisClient.expire(ACTIVE_ORDERS_KEY, TTL_SECONDS);

        if (
          currentStatus === OrderStatus.COMPLETED ||
          currentStatus === OrderStatus.CANCELLED
        ) {
          await this.stopTrackingOrder(phone, orderId);
          console.log(
            `[order-tracking] stopped ${orderId} (terminal: ${currentStatus})`,
          );
        }
      } catch (err) {
        console.error(`[order-tracking] poll error for ${orderId}:`, err);
      }

      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

export default new OrderTrackingService();
