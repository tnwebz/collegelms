import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { limiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/ai.routes';
import testRoutes from './routes/test.routes';
import courseRoutes from './routes/course.routes';
import batchRoutes from './routes/batch.routes';
import staffRoutes from './routes/staff.routes';
import studentRoutes from './routes/student.routes';
import userRoutes from './routes/user.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import contentRoutes from './routes/content.routes';
import liveRoutes from './routes/live.routes';
import proctoringRoutes from './routes/proctoring.routes';
import miscRoutes from './routes/misc.routes';
import superadminRoutes from './routes/superadmin.routes';
import { authenticate } from './middleware/auth';
import { getBatchPlayer } from './controllers/course.controller';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// ── Static Files ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Generic Routes ──────────────────────────────────────────
app.use('/api/v1', authRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1', contentRoutes);
app.use('/api/v1', miscRoutes);

// ── Role-Based Dashboard Routes ─────────────────────────────
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/superadmin', superadminRoutes);

// ── Resource Routes ─────────────────────────────────────────
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/code-tests', testRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/live', liveRoutes);
app.use('/api/v1/proctoring', proctoringRoutes);

// ── Batch Player ────────────────────────────────────────────
app.get('/api/v1/batches/:batch_id/player', authenticate, getBatchPlayer);

// ── Health Check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
