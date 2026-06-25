import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getMe, changePassword, updateMe } from '../controllers/user.controller';
import { uploadProfilePicture } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/users/me', authenticate, getMe);
router.post('/user/change-password', authenticate, changePassword);
router.put('/users/me', authenticate, uploadProfilePicture, updateMe);

export default router;
