import { Router } from 'express';
import { generateChallenge } from '../controllers/ai.controller';

const router = Router();

router.post('/generate-challenge', generateChallenge);

export default router;
