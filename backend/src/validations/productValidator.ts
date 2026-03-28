import { z } from 'zod';
import { ProductCategoryEnum } from '../interfaces/IProduct';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  category: z.enum(ProductCategoryEnum),
  quantity: z.coerce.number().min(0, 'Stock must be non-negative').optional(),
  quality: z.coerce.number().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  price: z.coerce.number().positive('Price must be positive').optional(),
  category: z.enum(ProductCategoryEnum).optional(),
  quantity: z.coerce.number().min(0, 'Stock must be non-negative').optional(),
  imageUrl: z.url('Invalid image URL').optional(),
});

const bulkCreateSchema = z.object({
  groupName: z.string().min(1, 'Group name is required'),
  category: z.enum(ProductCategoryEnum),
  price: z.coerce.number().positive('Price must be greater than 0'),
  quantity: z.coerce.number().min(0).optional()
});

export { createProductSchema, updateProductSchema, bulkCreateSchema };
