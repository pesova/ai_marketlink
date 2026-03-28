import { Router } from 'express';
import { initiatePayment, getEscrowByOrder, checkTransactionStatus } from '../controllers/PaymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/initiate', initiatePayment);
router.get('/escrow/:orderId', getEscrowByOrder);
router.get('/status', checkTransactionStatus);

export default router;
