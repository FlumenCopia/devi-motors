import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import quotationRoutes from './routes/quotationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportsRoutes from './routes/reportsRoutes';
import settingsRoutes from './routes/settingsRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS settings
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, uptime pingers)
      if (!origin) return callback(null, true);
      if (
        origin === clientUrl ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static assets serving (logos, stamps, uploads)
const assetsDir = path.resolve(__dirname, '../../../assets');
app.use('/assets', express.static(assetsDir));
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check for Render & UptimeRobot keep-alive
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'DEVI MOTORS API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();
  app.listen(port, () => {
    console.log(`[DEVI MOTORS API] Running on http://localhost:${port}`);
  });
}

startServer();
