import { Router } from 'express';
import { authenticate, requireInstructor } from '../middleware/auth';
import {
  toggleContentComplete, updateContentItem, deleteContentItem, 
  updateModule, deleteModule, reorderModules, reorderContentItems, 
  submitAssignment, createContentItem 
} from '../controllers/content.controller';

const router = Router();

router.post('/content/:id/complete', authenticate, toggleContentComplete);
router.post('/content', requireInstructor as any, createContentItem);
router.patch('/content/:id', requireInstructor as any, updateContentItem);
router.delete('/content/:id', requireInstructor as any, deleteContentItem);

router.patch('/modules/:id', requireInstructor, updateModule);
router.delete('/modules/:id', requireInstructor, deleteModule);
router.put('/courses/:course_id/modules/reorder', requireInstructor, reorderModules);
router.put('/modules/:id/reorder', requireInstructor, reorderContentItems);

router.post('/submit-assignment', authenticate, submitAssignment);

export default router;
