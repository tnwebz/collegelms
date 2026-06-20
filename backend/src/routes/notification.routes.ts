import { Router } from 'express';
import { authenticate, requireInstructor } from '../middleware/auth';
import { 
  getNotifications, markNotificationsRead, deleteNotification, sendNotification 
} from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/read', authenticate, markNotificationsRead);
router.post('/send', requireInstructor, sendNotification);
router.delete('/:id', authenticate, deleteNotification);

export default router;
