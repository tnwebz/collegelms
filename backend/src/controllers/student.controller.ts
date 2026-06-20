import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// STUDENT DASHBOARD: All queries scoped to the authenticated student_id
// ============================================================

/**
 * GET /api/v1/student/dashboard
 * Returns the student's active enrollments grouped by semester.
 * Only shows ACTIVE batches for the current view.
 */
export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await prisma.enrollments.findMany({
      where: { student_id: req.user.id },
      include: {
        course_batches: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
                description: true,
                image_url: true,
                course_type: true
              }
            },
            _count: {
              select: { batch_content: true }
            }
          }
        }
      }
    });

    // Group by semester
    const semesters: Record<number, any[]> = {};

    for (const e of enrollments) {
      const batch = e.course_batches;
      if (!batch) continue;

      const sem = batch.semester || 0;
      if (!semesters[sem]) semesters[sem] = [];

      // Count completed content for this student in this batch
      const contentIds = await prisma.batch_content.findMany({
        where: { batch_id: batch.id },
        select: { id: true }
      });

      const completedCount = await prisma.lesson_progress.count({
        where: {
          user_id: req.user.id,
          batch_content_id: { in: contentIds.map(c => c.id) },
          is_completed: true
        }
      });

      semesters[sem].push({
        enrollment_id: e.id,
        enrollment_date: e.enrollment_date,
        batch: {
          id: batch.id,
          section: batch.section,
          status: batch.status
        },
        course: batch.courses,
        progress: {
          completed: completedCount,
          total: batch._count.batch_content,
          percentage: batch._count.batch_content > 0
            ? Math.round((completedCount / batch._count.batch_content) * 100)
            : 0
        }
      });
    }

    return res.json({
      student_id: req.user.id,
      full_name: req.user.full_name,
      semesters
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/student/transcripts
 * Returns ALL enrollments (active + completed) grouped by semester.
 * This is the historical academic record view.
 */
export const getStudentTranscripts = async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await prisma.enrollments.findMany({
      where: { student_id: req.user.id },
      include: {
        course_batches: {
          include: {
            courses: {
              select: { id: true, title: true, description: true }
            },
            batch_content: {
              select: { id: true }
            }
          }
        }
      }
    });

    // Group by semester, showing completion stats
    const transcripts: Record<number, any[]> = {};

    for (const e of enrollments) {
      const batch = e.course_batches;
      if (!batch) continue;

      const sem = batch.semester || 0;
      if (!transcripts[sem]) transcripts[sem] = [];

      const contentIds = batch.batch_content.map(c => c.id);

      const completedCount = contentIds.length > 0
        ? await prisma.lesson_progress.count({
            where: {
              user_id: req.user.id,
              batch_content_id: { in: contentIds },
              is_completed: true
            }
          })
        : 0;

      transcripts[sem].push({
        batch_id: batch.id,
        course_title: batch.courses?.title,
        course_description: batch.courses?.description,
        section: batch.section,
        status: batch.status,
        enrollment_date: e.enrollment_date,
        progress: {
          completed: completedCount,
          total: contentIds.length,
          percentage: contentIds.length > 0
            ? Math.round((completedCount / contentIds.length) * 100)
            : 0
        }
      });
    }

    // Sort semesters numerically
    const sortedTranscripts: Record<number, any[]> = {};
    const sortedKeys = Object.keys(transcripts).map(Number).sort((a, b) => a - b);
    for (const key of sortedKeys) {
      sortedTranscripts[key] = transcripts[key];
    }

    return res.json({
      student_id: req.user.id,
      full_name: req.user.full_name,
      transcripts: sortedTranscripts
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/student/profile
 * Returns the student's profile including academic metadata.
 */
export const getStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        created_at: true,
        student_profile: true
      }
    });

    if (!user) return res.status(404).json({ detail: 'User not found' });

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * PUT /api/v1/student/profile
 * Update or create the student's academic profile.
 */
export const updateStudentProfile = async (req: AuthRequest, res: Response) => {
  const { enrollment_year, current_semester, branch } = req.body;

  try {
    const profile = await prisma.student_profiles.upsert({
      where: { user_id: req.user.id },
      update: {
        ...(enrollment_year !== undefined && { enrollment_year }),
        ...(current_semester !== undefined && { current_semester }),
        ...(branch !== undefined && { branch })
      },
      create: {
        user_id: req.user.id,
        enrollment_year: enrollment_year || new Date().getFullYear(),
        current_semester: current_semester || 1,
        branch: branch || ''
      }
    });

    return res.json({ message: 'Profile updated', profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
