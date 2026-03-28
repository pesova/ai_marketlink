import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { sendMessage, getChatHistory, clearChatHistory } from '../controllers/chatController';

const router = Router();

router.use(authenticateToken);

router.post('/', sendMessage);
router.get('/', getChatHistory);
router.delete('/history', clearChatHistory);

export default router;
