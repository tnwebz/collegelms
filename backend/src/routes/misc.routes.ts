import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { enrollInBatch, enrollInCourse, getMyCourses, solveChallenge } from '../controllers/course.controller';

const router = Router();

// Enrollment is now batch-based
router.post('/enroll/batch/:batch_id', authenticate, enrollInBatch);
// Legacy wrapper
router.post('/enroll/:course_id', authenticate, enrollInCourse);
router.get('/my-courses', authenticate, getMyCourses);
router.post('/challenges/:challenge_id/solve', authenticate, solveChallenge);

export default router;
