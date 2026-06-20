import { Router } from 'express';
import { registerUser, loginUser, loginOtp } from '../controllers/auth.controller';

const router = Router();

router.post('/users', registerUser);
router.post('/login', loginUser);
router.post('/login-otp', loginOtp);

export default router;
