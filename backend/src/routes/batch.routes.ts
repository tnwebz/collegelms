import { Router } from 'express';
import { requireInstructor } from '../middleware/auth';
import { updateBatchStatus, addBatchContent } from '../controllers/batch.controller';

const router = Router();

router.put('/:batch_id/status', requireInstructor as any, updateBatchStatus);
router.post('/:batch_id/content', requireInstructor as any, addBatchContent);

export default router;
