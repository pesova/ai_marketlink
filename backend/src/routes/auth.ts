import { Router } from 'express';
import { 
  register,
  login,
  getProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  logout
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Auth endpoints with middleware in routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/profile', authenticateToken, getProfile);

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

router.post('/logout', logout);

export default router;
