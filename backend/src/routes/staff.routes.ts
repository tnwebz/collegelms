import { Router } from 'express';
import { requireStaff } from '../middleware/auth';
import {
  getStaffDashboard,
  getBatchStudents,
  getBatchProgress,
  admitToBatch,
  getStaffAssignments,
  verifyAssignment
} from '../controllers/staff.controller';

const router = Router();

// GET /api/v1/staff/dashboard — full course + batch overview
router.get('/dashboard', requireStaff as any, getStaffDashboard);

// GET /api/v1/staff/batches/:batch_id/students — enrolled students with profiles
router.get('/batches/:batch_id/students', requireStaff as any, getBatchStudents);

// GET /api/v1/staff/batches/:batch_id/progress — completion analytics per student
router.get('/batches/:batch_id/progress', requireStaff as any, getBatchProgress);

// POST /api/v1/staff/admit-to-batch
router.post('/admit-to-batch', requireStaff as any, admitToBatch);

// GET /api/v1/staff/assignments
router.get('/assignments', requireStaff as any, getStaffAssignments);

// POST /api/v1/staff/verify-assignment/:submissionId
router.post('/verify-assignment/:submissionId', requireStaff as any, verifyAssignment);

export default router;
