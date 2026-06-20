import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getActiveLiveSessions } from '../controllers/live.controller';

const router = Router();

router.get('/active', authenticate, getActiveLiveSessions);

export default router;
