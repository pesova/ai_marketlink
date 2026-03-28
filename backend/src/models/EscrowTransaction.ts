import mongoose, { Document, Schema } from 'mongoose';

export enum EscrowStatus {
  INITIATED = 'INITIATED', // created when payment link generated
  HOLDING = 'HOLDING',       // payment confirmed, funds locked
  RELEASED = 'RELEASED',     // buyer confirmed delivery, funds sent to vendor
  REFUNDED = 'REFUNDED',     // order cancelled, funds returned to buyer
}

export interface IEscrowTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  amount: number;
  status: EscrowStatus;
  interswitchRef: string;       // transactionRef from Interswitch
  interswitchPaymentId?: string; // paymentId returned by Interswitch
  releasedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const escrowTransactionSchema = new Schema<IEscrowTransaction>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
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
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EscrowStatus),
      required: true,
      default: EscrowStatus.INITIATED,
    },
    interswitchRef: {
      type: String,
      required: true,
      unique: true,
    },
    interswitchPaymentId: {
      type: String,
      required: false,
    },
    releasedAt: {
      type: Date,
      required: false,
    },
    refundedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const EscrowTransaction = mongoose.model<IEscrowTransaction>(
  'EscrowTransaction',
  escrowTransactionSchema
);
