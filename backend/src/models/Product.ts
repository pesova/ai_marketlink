import mongoose, { Document, Schema } from 'mongoose';
import { ProductCategoryEnum } from '../interfaces/IProduct';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: ProductCategoryEnum;
  quantity: number;
  imageUrl?: string;
  vendor: mongoose.Types.ObjectId;
  embedding?: number[];
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: Object.values(ProductCategoryEnum),
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
  },
  embedding: {
    type: [Number],
    select: false, // Exclude embedding from queries by default
  },
}, {
  timestamps: true,
});

// Create indexes for better query performance
productSchema.index({ vendor: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Compound index for common queries
productSchema.index({ vendor: 1, category: 1 });
productSchema.index({ category: 1, price: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;