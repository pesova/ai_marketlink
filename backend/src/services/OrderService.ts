import { Types } from 'mongoose';
import { Order, OrderStatus } from '../models/Order';
import { CreateOrderInput } from '../validations/orderValidator';
import EscrowService from './EscrowService';

class OrderService {
  public async createOrder(buyerId: string, input: CreateOrderInput) {
    const { productId, quantity, deliveryAddress } = input;

    const { Product } = await import('../models/Product');

    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.quantity < quantity) throw new Error(`Only ${product.quantity} unit(s) available`);

    const unitPrice = product.price;
    const totalAmount = unitPrice * quantity;

    const order = await Order.create({
      buyer: new Types.ObjectId(buyerId),
      vendor: product.vendor,
      product: product._id,
      quantity,
      unitPrice,
      totalAmount,
      deliveryAddress,
      status: OrderStatus.PENDING_PAYMENT,
    });

    return order;
  }

  public async getBuyerOrders(buyerId: string) {
    return Order.find({ buyer: new Types.ObjectId(buyerId) })
      .populate('product', 'name imageUrl price category')
      .populate('vendor', 'businessName')
      .sort({ createdAt: -1 });
  }

  public async getOrderById(orderId: string, requestingUserId: string) {
    const order = await Order.findById(orderId)
      .populate('product', 'name imageUrl price category')
      .populate('vendor', 'businessName')
      .populate('buyer', 'name email');

    if (!order) throw new Error('Order not found');

    const isOwner =
      order.buyer._id.toString() === requestingUserId ||
      order.vendor._id.toString() === requestingUserId;

    if (!isOwner) throw new Error('Unauthorised');

    return order;
  }

  public async getVendorOrders(vendorId: string) {
    return Order.find({ vendor: new Types.ObjectId(vendorId) })
      .populate('product', 'name imageUrl price category')
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 });
  }

  public async markShipped(orderId: string, vendorId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.vendor.toString() !== vendorId) throw new Error('Unauthorised');
    if (order.status !== OrderStatus.PAID_IN_ESCROW) {
      throw new Error(`Cannot mark as shipped — current status is ${order.status}`);
    }

    order.status = OrderStatus.SHIPPED;
    order.shippedAt = new Date();
    await order.save();
    return order;
  }

  /**
   * Vendor confirms the item reached the buyer — order waits for buyer confirmation (or auto-release).
   */
  public async markDelivered(orderId: string, vendorId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.vendor.toString() !== vendorId) throw new Error('Unauthorised');
    if (order.status !== OrderStatus.SHIPPED) {
      throw new Error(`Cannot mark as delivered — current status is ${order.status}`);
    }

    order.status = OrderStatus.DELIVERED_PENDING_CONFIRMATION;
    order.deliveredAt = new Date();
    order.pendingBuyerConfirmationAt = new Date();
    await order.save();
    return order;
  }

  /**
   * Buyer confirms delivery.
   * Triggers escrow release → order moves to COMPLETED.
   */
  public async confirmDelivery(orderId: string, buyerId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.buyer.toString() !== buyerId) throw new Error('Unauthorised');
    const canConfirm =
      order.status === OrderStatus.DELIVERED_PENDING_CONFIRMATION ||
      order.status === OrderStatus.SHIPPED;
    if (!canConfirm) {
      throw new Error(`Cannot confirm delivery — current status is ${order.status}`);
    }

    await EscrowService.releaseForOrder(orderId);

    const updated = await Order.findById(orderId);
    return updated;
  }

  public async cancelOrder(orderId: string, requestingUserId: string, role: 'buyer' | 'vendor') {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    if (role === 'buyer') {
      if (order.buyer.toString() !== requestingUserId) throw new Error('Unauthorised');
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        await EscrowService.voidInitiatedForOrder(orderId);
      } else if (order.status === OrderStatus.PAID_IN_ESCROW) {
        await EscrowService.refundForOrder(orderId);
      } else {
        throw new Error(
          'Order cannot be cancelled at this stage. Contact support if you need help.',
        );
      }
    } else {
      if (order.vendor.toString() !== requestingUserId) throw new Error('Unauthorised');
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new Error('Vendors can only cancel orders that are still awaiting payment');
      }
      await EscrowService.voidInitiatedForOrder(orderId);
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    await order.save();
    return order;
  }
}

export default new OrderService();
