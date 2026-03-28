import { Router } from 'express';
import {
  getAllEscrows,
  getVendorBalances,
  resolveDispute,
  getAllUsers,
  getAllOrders,
  getAllVendors,
} from '../controllers/AdminController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken, isAdmin);

router.get('/escrows', getAllEscrows);
router.get('/vendor/:vendorId/balances', getVendorBalances);
router.get('/users', getAllUsers);
router.get('/orders', getAllOrders);
router.get('/vendors', getAllVendors);

router.post('/dispute', resolveDispute);
export default router;
