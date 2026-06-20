import { Router } from 'express';
import { 
  createCodeTest, 
  getCodeTests, 
  startCodeTest, 
  submitTestResult, 
  getTestResults, 
  executeCode 
} from '../controllers/test.controller';
import { authenticate, requireInstructor } from '../middleware/auth';

const router = Router();

router.post('/', requireInstructor as any, createCodeTest);
router.get('/', authenticate as any, getCodeTests);
router.post('/:test_id/start', authenticate as any, startCodeTest);
router.post('/submit', authenticate as any, submitTestResult);
router.get('/:test_id/results', requireInstructor as any, getTestResults);
router.post('/execute', executeCode);

export default router;
