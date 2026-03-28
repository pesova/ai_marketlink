import EscrowService from '../services/EscrowService';
import { EscrowTransaction } from '../models/EscrowTransaction';
import { User } from '../models/User';
import { Order, OrderStatus } from '../models/Order';
import { Vendor } from '../models/Vendor';

class AdminService {
  async getAllEscrows() {
    return EscrowTransaction.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'order',
        select: 'status totalAmount createdAt',
        populate: { path: 'product', select: 'name' },
      })
      .populate('buyer', 'name email')
      .populate('vendor', 'businessName firstName lastName');
  }

  async getVendorBalances(vendorId: string) {
    const holding = await EscrowService.getVendorEscrowBalance(vendorId);
    const available = await EscrowService.getVendorAvailableBalance(vendorId);
    return { vendorId, holdingBalance: holding, availableBalance: available };
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find()
        .populate('roleId')
        .skip(skip)
        .limit(limit)
        .select('-password'),
      User.countDocuments(),
    ]);
    return { users, total, page, limit };
  }

  async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .populate('buyer', 'name email')
        .populate('vendor', 'businessName firstName lastName')
        .populate('product', 'name price')
        .skip(skip)
        .limit(limit),
      Order.countDocuments(),
    ]);
    return { orders, total, page, limit };
  }

  async getAllVendors(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [vendors, total] = await Promise.all([
      Vendor.find()
        .sort({ createdAt: -1 })
        .populate('user', 'name email')
        .skip(skip)
        .limit(limit),
      Vendor.countDocuments(),
    ]);
    return { vendors, total, page, limit };
  }

  // Resolve dispute
  async resolveDispute(orderId: string, action: string) {
    if (action === 'release') {
      await EscrowService.releaseForOrder(orderId);
    } else if (action === 'refund') {
      await EscrowService.refundForOrder(orderId);
      await Order.findByIdAndUpdate(orderId, {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      }).exec();
    } else {
      throw new Error("action must be 'release' or 'refund'");
    }
  }
}

export default new AdminService();
