import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByVendor,
  searchProducts,
  bulkCreateProducts
} from '../controllers/productController';
import { authenticateToken, isVendor } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

// All routes below this line require authenticateToken + isVendor
router.use(authenticateToken, isVendor);

router.post('/', createProduct);
router.post('/bulk', bulkCreateProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/vendor/my-products', getProductsByVendor);

export default router;