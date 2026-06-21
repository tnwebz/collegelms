import { Router } from 'express';
import { requireInstructor } from '../middleware/auth';
import { updateBatchStatus, addBatchContent, uploadBatchVideo } from '../controllers/batch.controller';
import { uploadVideo } from '../middleware/uploadMiddleware';

const router = Router();

router.put('/:batch_id/status', requireInstructor as any, updateBatchStatus);
router.post('/:batch_id/content', requireInstructor as any, addBatchContent);
router.post('/:batch_id/videos', requireInstructor as any, uploadVideo, uploadBatchVideo as any);

export default router;
