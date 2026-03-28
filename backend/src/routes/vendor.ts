import { Router } from 'express';
import {
  onboardVendor,
  getProfile,
  updateBankDetails,
  getProducts,
  getOrders,
  getBalance,
  getPublicVendor,
  onboardExistingVendor
} from '../controllers/vendorController';
import { authenticateToken, isVendor } from '../middleware/auth';

const router = Router();

// Onboard – only authentication
router.post('/onboard', onboardVendor);

// With auth — for existing users onboarding as vendor
router.post('/onboard/existing', authenticateToken, onboardExistingVendor);

router.use(authenticateToken, isVendor);

// Protected vendor routes – require vendor profile
router.get('/profile', getProfile);
router.patch('/bank-details', updateBankDetails);
router.get('/products', getProducts);
router.get('/orders', getOrders);
router.get('/balance', getBalance);

// Public vendor profile
router.get('/:id', getPublicVendor);

export default router;
