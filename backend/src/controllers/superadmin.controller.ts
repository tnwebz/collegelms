import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const DEPARTMENTS = ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'Mechatronics'];

// ============================================================
// SUPER ADMIN: ONBOARD HOD
// ============================================================
export const onboardHod = async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, age, gender, login_id, password, department } = req.body;

    if (!full_name || !login_id || !password || !department) {
      return res.status(400).json({ detail: 'Missing required fields: full_name, login_id, password, department' });
    }

    // Check if login_id or email already exists
    const existing = await prisma.users.findFirst({
      where: { OR: [{ email: login_id }, { login_id: login_id }] }
    });
    if (existing) {
      return res.status(409).json({ detail: 'A user with this Login ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email: login_id,
        login_id: login_id,
        full_name,
        hashed_password: hashedPassword,
        role: 'HOD',
        is_active: true,
        created_at: new Date(),
        hod_profile: {
          create: {
            department,
            age: age ? parseInt(age) : null,
            gender: gender || null
          }
        }
      },
      include: { hod_profile: true }
    });

    return res.status(201).json({ message: 'HOD onboarded successfully', user_id: user.id, full_name: user.full_name, department });
  } catch (error) {
    console.error('Error onboarding HOD:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// SUPER ADMIN: ONBOARD STAFF
// ============================================================
export const onboardStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, age, gender, login_id, password } = req.body;

    if (!full_name || !login_id || !password) {
      return res.status(400).json({ detail: 'Missing required fields: full_name, login_id, password' });
    }

    const existing = await prisma.users.findFirst({
      where: { OR: [{ email: login_id }, { login_id: login_id }] }
    });
    if (existing) {
      return res.status(409).json({ detail: 'A user with this Login ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email: login_id,
        login_id: login_id,
        full_name,
        hashed_password: hashedPassword,
        role: 'STAFF',
        is_active: true,
        created_at: new Date(),
        staff_profile: {
          create: {
            age: age ? parseInt(age) : null,
            gender: gender || null
          }
        }
      },
      include: { staff_profile: true }
    });

    return res.status(201).json({ message: 'Staff onboarded successfully', user_id: user.id, full_name: user.full_name });
  } catch (error) {
    console.error('Error onboarding staff:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// SUPER ADMIN: ONBOARD SINGLE STUDENT
// ============================================================
export const onboardStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, email, password, batch_year, department, section } = req.body;

    if (!full_name || !email || !password || !batch_year || !department || !section) {
      return res.status(400).json({ detail: 'Missing required fields' });
    }

    const existing = await prisma.users.findFirst({
      where: { OR: [{ email }, { login_id: email }] }
    });
    if (existing) {
      return res.status(409).json({ detail: 'A student with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        email,
        login_id: email,
        full_name,
        hashed_password: hashedPassword,
        role: 'STUDENT',
        is_active: true,
        created_at: new Date(),
        student_profile: {
          create: {
            batch_year,
            branch: department,
            section
          }
        }
      },
      include: { student_profile: true }
    });

    return res.status(201).json({ message: 'Student onboarded successfully', user_id: user.id, full_name: user.full_name });
  } catch (error) {
    console.error('Error onboarding student:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// SUPER ADMIN: BULK ONBOARD STUDENTS (JSON from frontend parsed Excel)
// ============================================================
export const bulkOnboardStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { students, batch_year, department, section } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ detail: 'No students data provided' });
    }
    if (!batch_year || !department || !section) {
      return res.status(400).json({ detail: 'Missing batch_year, department, or section' });
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const s of students) {
      try {
        const { full_name, email, password } = s;
        if (!full_name || !email || !password) {
          results.failed++;
          results.errors.push(`Missing fields for: ${full_name || email || 'unknown'}`);
          continue;
        }

        const existing = await prisma.users.findFirst({
          where: { OR: [{ email }, { login_id: email }] }
        });
        if (existing) {
          results.failed++;
          results.errors.push(`Already exists: ${email}`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.users.create({
          data: {
            email,
            login_id: email,
            full_name,
            hashed_password: hashedPassword,
            role: 'STUDENT',
            is_active: true,
            created_at: new Date(),
            student_profile: {
              create: {
                batch_year,
                branch: department,
                section
              }
            }
          }
        });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Error for ${s.email || 'unknown'}: ${err.message}`);
      }
    }

    return res.json({
      message: `Bulk onboarding complete: ${results.success} success, ${results.failed} failed`,
      ...results
    });
  } catch (error) {
    console.error('Error bulk onboarding:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// SUPER ADMIN: LIST ALL HODs, STAFF, STUDENTS
// ============================================================
export const listHods = async (req: AuthRequest, res: Response) => {
  try {
    const hods = await prisma.users.findMany({
      where: { role: 'HOD' },
      include: { hod_profile: true },
      orderBy: { id: 'desc' }
    });
    return res.json(hods);
  } catch (error) {
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const listAllStaff = async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.users.findMany({
      where: { role: 'STAFF' },
      include: { staff_profile: true },
      orderBy: { id: 'desc' }
    });
    return res.json(staff);
  } catch (error) {
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const listStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { batch_year, department, section } = req.query;
    const where: any = { role: 'STUDENT' };
    
    if (batch_year || department || section) {
      where.student_profile = {};
      if (batch_year) where.student_profile.batch_year = batch_year as string;
      if (department) where.student_profile.branch = department as string;
      if (section) where.student_profile.section = section as string;
    }

    const students = await prisma.users.findMany({
      where,
      include: { student_profile: true },
      orderBy: { id: 'desc' }
    });
    return res.json(students);
  } catch (error) {
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// SUPER ADMIN: DASHBOARD STATS
// ============================================================
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [hodCount, staffCount, studentCount, courseCount] = await Promise.all([
      prisma.users.count({ where: { role: 'HOD' } }),
      prisma.users.count({ where: { role: 'STAFF' } }),
      prisma.users.count({ where: { role: 'STUDENT' } }),
      prisma.courses.count()
    ]);

    return res.json({ hods: hodCount, staff: staffCount, students: studentCount, courses: courseCount });
  } catch (error) {
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
