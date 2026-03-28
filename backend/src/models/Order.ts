import mongoose, { Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID_IN_ESCROW = 'PAID_IN_ESCROW',
  SHIPPED = 'SHIPPED',
  DELIVERED_PENDING_CONFIRMATION = 'DELIVERED_PENDING_CONFIRMATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  interswitchRef?: string;
  interswitchTransactionRef?: string;
  shippedAt?: Date;
  /** Set when the order enters DELIVERED_PENDING_CONFIRMATION (buyer confirmation window / auto-release clock). */
  pendingBuyerConfirmationAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
      default: OrderStatus.PENDING_PAYMENT,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    shippedAt: {
      type: Date,
      required: false,
    },
    pendingBuyerConfirmationAt: {
      type: Date,
      required: false,
    },
    deliveredAt: {
      type: Date,
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
    interswitchRef: {
      type: String,
      required: false,
    },
    interswitchTransactionRef: {
      type: String,
      required: false,
    },
    cancelledAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);