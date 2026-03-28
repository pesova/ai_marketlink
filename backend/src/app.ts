import express, { Request, Response } from 'express';
import env from './config/env';
import cors from 'cors';
import authRoutes from './routes/auth';
import vendorRoutes from './routes/vendor';
import { errorHandler } from './utils/errorHandler';
import productRoutes from './routes/product';
import chatRoutes from './routes/chat';
import orderRoutes from './routes/order';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import whatsappRoutes from './integrations/whatsapp/routes/whatsapp.routes';
import webhookRoutes from './routes/webhook';


const app = express();
const allowedOrigins = env.ALLOWED_ORIGINS;
app.use(cors({
  origin: allowedOrigins, // or your deployed frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// API Routes
app.use('/webhook', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Test route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'AI MarketLink API is running!' });
});


// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler)

export default app;