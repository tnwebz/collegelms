import { Router } from 'express';
import { requireAdmin, requireStaff } from '../middleware/auth';
import { 
  admitStudent, bulkAdmitStudents, listStudents, deleteStudent, resetStudentPassword, createStaff, getStaffList, enrollExistingToBatch 
} from '../controllers/admin.controller';

const router = Router();

// Admin-only: create staff accounts
router.post('/staff', requireAdmin as any, createStaff);
router.get('/staff', requireAdmin as any, getStaffList);

// Staff/Admin: manage students
router.post('/admit-student', requireStaff as any, admitStudent);
router.post('/bulk-admit', requireStaff as any, bulkAdmitStudents);
router.post('/batches/:batch_id/enroll-existing', requireStaff as any, enrollExistingToBatch);
router.get('/students', requireStaff as any, listStudents);
router.delete('/students/:id', requireStaff as any, deleteStudent);
router.patch('/students/:id/reset-password', requireStaff as any, resetStudentPassword);

export default router;
