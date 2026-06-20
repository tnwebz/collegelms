import { Router } from 'express';
import { requireStudent } from '../middleware/auth';
import {
  getStudentDashboard,
  getStudentTranscripts,
  getStudentProfile,
  updateStudentProfile
} from '../controllers/student.controller';

const router = Router();

// GET /api/v1/student/dashboard — active enrollments grouped by semester
router.get('/dashboard', requireStudent as any, getStudentDashboard);

// GET /api/v1/student/transcripts — full academic history grouped by semester
router.get('/transcripts', requireStudent as any, getStudentTranscripts);

// GET /api/v1/student/profile — student profile + academic metadata
router.get('/profile', requireStudent as any, getStudentProfile);

// PUT /api/v1/student/profile — update academic profile
router.put('/profile', requireStudent as any, updateStudentProfile);

export default router;
