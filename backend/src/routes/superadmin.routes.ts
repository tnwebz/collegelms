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
  getDashboardStats,
  updateUser,
  deleteUser,
  resetUserPassword,
  getFilters
} from '../controllers/superadmin.controller';

const router = Router();

// Dashboard
router.get('/stats', requireSuperAdmin, getDashboardStats);

// Filters
router.get('/filters', requireSuperAdmin, getFilters);

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

// User Management
router.put('/users/:id', requireSuperAdmin, updateUser);
router.delete('/users/:id', requireSuperAdmin, deleteUser);
router.patch('/users/:id/reset-password', requireSuperAdmin, resetUserPassword);

export default router;
