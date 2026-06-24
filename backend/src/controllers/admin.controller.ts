import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { sendCredentialsEmail } from '../services/email.service';

const generateRandomPassword = (length = 8) => {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  return Array.from({ length }).map(() => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
};

export const admitStudent = async (req: Request, res: Response) => {
  const { full_name, email, batch_ids, password } = req.body;

  try {
    let student = await prisma.users.findUnique({ where: { email } });
    const finalPassword = password || generateRandomPassword();
    let isNewUser = false;
    let emailStatus = 'skipped';

    if (!student) {
      isNewUser = true;

      try {
        await sendCredentialsEmail(email, full_name, finalPassword);
        emailStatus = 'sent';
      } catch (error: any) {
        console.error(`❌ Aborting User Creation because Email Failed: ${error}`);
        return res.status(500).json({ detail: `Email failed: ${error.message}` });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(finalPassword, salt);

      student = await prisma.users.create({
        data: {
          email,
          full_name,
          hashed_password: hashedPassword,
          role: 'STUDENT',
          is_active: true,
          created_at: new Date()
        }
      });
    }

    const enrolled = [];
    if (batch_ids && batch_ids.length > 0) {
      for (const bid of batch_ids) {
        const check = await prisma.enrollments.findFirst({
          where: { student_id: student.id, batch_id: bid }
        });

        if (!check) {
          await prisma.enrollments.create({
            data: {
              student_id: student.id,
              batch_id: bid,
              enrollment_date: new Date()
            }
          });
          enrolled.push(bid);
        }
      }
    }

    if (isNewUser) {
      return res.json({ message: `User created & Email Sent! Enrolled in ${enrolled.length} batches.`, email_status: emailStatus });
    } else {
      return res.json({ message: 'Existing user enrolled.', email_status: emailStatus });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const bulkAdmitStudents = async (req: Request, res: Response) => {
  // Logic to handle multipart/form-data for CSV upload can be added here
  // For now returning 501 Not Implemented
  return res.status(501).json({ detail: 'Bulk admit not yet implemented' });
};

export const enrollExistingToBatch = async (req: Request, res: Response) => {
  const batchId = parseInt(req.params.batch_id as string, 10);
  const { student_ids } = req.body;

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ detail: 'No students provided' });
  }

  try {
    const enrollmentsToCreate = [];
    const alreadyEnrolled = [];

    for (const studentId of student_ids) {
      const check = await prisma.enrollments.findFirst({
        where: { student_id: studentId, batch_id: batchId }
      });
      if (!check) {
        enrollmentsToCreate.push({
          student_id: studentId,
          batch_id: batchId,
          enrollment_date: new Date()
        });
      } else {
        alreadyEnrolled.push(studentId);
      }
    }

    if (enrollmentsToCreate.length > 0) {
      await prisma.enrollments.createMany({
        data: enrollmentsToCreate
      });
    }

    return res.json({ 
      message: `Successfully enrolled ${enrollmentsToCreate.length} students.`,
      skipped: alreadyEnrolled.length 
    });
  } catch (error) {
    console.error("Error in enrollExistingToBatch:", error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const listStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.users.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        email: true,
        full_name: true,
        is_active: true,
        created_at: true,
        last_login: true,
        phone_number: true,
        enrollments: {
          include: {
            course_batches: {
              include: {
                courses: true
              }
            }
          }
        }
      }
    });

    const formattedStudents = students.map(student => ({
      ...student,
      enrolled_batches: student.enrollments
        .filter((e: any) => e.course_batches)
        .map((e: any) => {
          const b = e.course_batches;
          return `${b.courses?.title || 'Unknown Course'} (Sem ${b.semester} - Sec ${b.section})`;
        })
    }));

    return res.json(formattedStudents);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id as string, 10);
  try {
    // Check if student exists
    const student = await prisma.users.findFirst({ where: { id: studentId, role: 'STUDENT' } });
    if (!student) return res.status(404).json({ detail: 'Student not found' });

    // In a real app, you'd delete related records or implement soft delete
    // We will just deactivate them for safety
    await prisma.users.update({
      where: { id: studentId },
      data: { is_active: false }
    });

    return res.json({ message: 'Student deactivated' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const resetStudentPassword = async (req: Request, res: Response) => {
  const studentId = parseInt(req.params.id as string, 10);
  const { new_password } = req.body;
  if (!new_password) return res.status(400).json({ detail: 'new_password is required' });

  try {
    const student = await prisma.users.findFirst({ where: { id: studentId, role: 'STUDENT' } });
    if (!student) return res.status(404).json({ detail: 'Student not found' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await prisma.users.update({
      where: { id: studentId },
      data: { hashed_password: hashedPassword }
    });

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  const { full_name, login_id, password, age, gender, qualification } = req.body;

  try {
    const existing = await prisma.users.findUnique({ where: { login_id } });
    if (existing) {
      return res.status(400).json({ detail: 'Login ID already exists' });
    }

    const finalPassword = password || generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(finalPassword, salt);

    const staff = await prisma.users.create({
      data: {
        login_id,
        full_name,
        hashed_password: hashedPassword,
        role: 'STAFF',
        is_active: true,
        created_at: new Date(),
        staff_profile: {
          create: {
            age: age ? parseInt(age, 10) : null,
            gender,
            qualification
          }
        }
      }
    });

    return res.status(201).json({ message: 'Staff created', staff_id: staff.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const getStaffList = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.users.findMany({
      where: { role: 'STAFF' },
      select: {
        id: true,
        login_id: true,
        email: true,
        full_name: true,
        is_active: true,
        created_at: true,
        last_login: true,
        phone_number: true,
        staff_profile: true
      },
      orderBy: { id: 'desc' }
    });

    return res.json(staff);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
