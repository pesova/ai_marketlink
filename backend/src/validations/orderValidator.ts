import { z } from 'zod';

export const createOrderSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
