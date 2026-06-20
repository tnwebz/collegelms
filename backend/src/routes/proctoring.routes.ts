import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProctoringStatus, reportViolation } from '../controllers/proctoring.controller';

const router = Router();

router.get('/status/:id', authenticate, getProctoringStatus);
router.post('/violation', authenticate, reportViolation);

export default router;
