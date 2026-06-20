import { Router } from 'express';
import { authenticate, requireStaff } from '../middleware/auth';
import { createBatch } from '../controllers/batch.controller';
import {
  getCourseDetails, listCourses, createCourse, updateCourseDetails, 
  getCoursePlayer, getCourseChallenges, 
  claimCertificate, generatePdf,
  getCourseModules, createCourseModule, publishCourse
} from '../controllers/course.controller';

const router = Router();

// Course blueprint CRUD
router.get('/', authenticate, listCourses);
router.post('/', requireStaff as any, createCourse);
router.get('/:course_id', authenticate, getCourseDetails);
router.patch('/:course_id/details', requireStaff as any, updateCourseDetails);
router.patch('/:course_id/publish', requireStaff as any, publishCourse);

// Legacy modules API for course builder
router.get('/:course_id/modules', authenticate, getCourseModules);
router.post('/:course_id/modules', requireStaff as any, createCourseModule);

// Batch instantiation under a course
router.post('/:course_id/batches', requireStaff as any, createBatch);

// Legacy course player (backward compat with frontend)
router.get('/:course_id/player', authenticate, getCoursePlayer);
router.get('/:course_id/challenges', authenticate, getCourseChallenges);
router.post('/:course_id/claim-certificate', authenticate, claimCertificate);
router.get('/generate-pdf/:course_id', authenticate, generatePdf);

export default router;
