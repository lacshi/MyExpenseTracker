import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import transactionRoutes from './routes/transactions.js';
import summaryRoutes from './routes/summary.js';
import exportRoutes from './routes/export.js';
import { authenticate } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', authenticate, categoryRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/summary', authenticate, summaryRoutes);
app.use('/api/export', authenticate, exportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
