import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMe, changePassword } from '../controllers/user.controller';

const router = Router();

router.get('/users/me', authenticate, getMe);
router.post('/user/change-password', authenticate, changePassword);

export default router;
