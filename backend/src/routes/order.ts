import { Router } from 'express';
import {
  getBuyerOrders,
  getOrderById,
  confirmDelivery,
  cancelOrder,
  markShipped,
  markDelivered,
  createOrder,
} from '../controllers/orderController';
import { authenticateToken, isVendor } from '../middleware/auth';

const router = Router();

// ─── Buyer routes ────────────────────────────────────────────────
router.use(authenticateToken);

router.post('/', createOrder);
router.get('/', getBuyerOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/confirm-delivery', confirmDelivery);
router.patch('/:orderId/cancel', cancelOrder);

// ─── Vendor routes ───────────────────────────────────────────────
router.patch('/:orderId/ship', isVendor, markShipped);
router.patch('/:orderId/delivered', isVendor, markDelivered);

export default router;