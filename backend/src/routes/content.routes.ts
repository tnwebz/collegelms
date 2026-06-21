import { Router } from 'express';
import { authenticate, requireInstructor } from '../middleware/auth';
import {
  toggleContentComplete, updateContentItem, deleteContentItem, 
  updateModule, deleteModule, reorderModules, reorderContentItems, 
  submitAssignment, createContentItem, createDirectVideoContentItem, createDirectDocumentContentItem
} from '../controllers/content.controller';
import { uploadVideo, uploadDocument } from '../middleware/uploadMiddleware';

const router = Router();

router.post('/content/:id/complete', authenticate, toggleContentComplete);
router.post('/content', requireInstructor as any, createContentItem);
router.post('/content/video', requireInstructor as any, uploadVideo, createDirectVideoContentItem as any);
router.post('/content/document', requireInstructor as any, uploadDocument, createDirectDocumentContentItem as any);
router.patch('/content/:id', requireInstructor as any, updateContentItem);
router.delete('/content/:id', requireInstructor as any, deleteContentItem);

router.patch('/modules/:id', requireInstructor, updateModule);
router.delete('/modules/:id', requireInstructor, deleteModule);
router.put('/courses/:course_id/modules/reorder', requireInstructor, reorderModules);
router.put('/modules/:id/reorder', requireInstructor, reorderContentItems);

router.post('/submit-assignment', authenticate, submitAssignment);

export default router;
