import { Router } from 'express';
import { requireSuperAdmin } from '../middleware/auth';
import {
  onboardHod,
  onboardStaff,
  onboardStudent,
  bulkOnboardStudents,
  listHods,
  listAllStaff,
  listStudents,
  getDashboardStats
} from '../controllers/superadmin.controller';

const router = Router();

// Dashboard
router.get('/stats', requireSuperAdmin, getDashboardStats);

// HOD
router.post('/onboard-hod', requireSuperAdmin, onboardHod);
router.get('/hods', requireSuperAdmin, listHods);

// Staff
router.post('/onboard-staff', requireSuperAdmin, onboardStaff);
router.get('/staff', requireSuperAdmin, listAllStaff);

// Students
router.post('/onboard-student', requireSuperAdmin, onboardStudent);
router.post('/bulk-onboard-students', requireSuperAdmin, bulkOnboardStudents);
router.get('/students', requireSuperAdmin, listStudents);

export default router;
