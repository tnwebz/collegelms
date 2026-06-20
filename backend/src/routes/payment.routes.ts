import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createOrder } from '../controllers/payment.controller';

const router = Router();

router.post('/create-order', authenticate, createOrder);

export default router;
