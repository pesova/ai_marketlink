import { Router } from 'express';
import whatsappController from '../controllers/whatsapp.controller';

const router = Router();

// GET verification endpoint
router.get('/', whatsappController.verifyWebhook);

// POST inbound messages (raw body needed – expressed in app.ts via express.raw)
router.post('/', whatsappController.handleIncomingMessage);

export default router;