import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  user: mongoose.Types.ObjectId;
  businessName: string;
  firstName: string;
  lastName: string;
  nin: string;
  phoneNumber: string;
  ninData: Record<string, any>;
  // Bank details for payouts
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  nin: {
    type: String,
    required: true,
    unique: true,
    select: false
  },
  ninData: {
    type: Schema.Types.Mixed,
    default: null,
    select: false
  },
    phoneNumber: {
      type: String,
      required: true
    },
    // Bank details for payouts (optional)
    accountName: {
      type: String,
      required: false
    },
    bankName: {
      type: String,
      required: false
    },
    accountNumber: {
      type: String,
      required: false
    }
  }, {
    timestamps: true
  });


export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);