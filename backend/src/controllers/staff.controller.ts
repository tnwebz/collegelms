import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// STAFF DASHBOARD: All queries scoped to the authenticated staff_id
// ============================================================

/**
 * GET /api/v1/staff/dashboard
 * Returns the staff member's full dashboard:
 * - All their course blueprints
 * - Each course's active/completed batches
 * - Enrollment counts per batch
 */
export const getStaffDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await prisma.courses.findMany({
      where: { staff_id: req.user.id },
      orderBy: { id: 'desc' },
      include: {
        course_batches: {
          orderBy: { id: 'desc' },
          include: {
            _count: {
              select: { enrollments: true, batch_content: true }
            }
          }
        }
      }
    });

    const result = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      is_published: course.is_published,
      batches: course.course_batches.map(batch => ({
        id: batch.id,
        semester: batch.semester,
        section: batch.section,
        year: batch.year,
        status: batch.status,
        enrolled_students: batch._count.enrollments,
        content_items: batch._count.batch_content
      }))
    }));

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/staff/batches/:batch_id/students
 * Returns all enrolled students for a specific batch,
 * including their student profiles.
 * Query is strictly scoped: the batch must belong to a course owned by the staff.
 */
export const getBatchStudents = async (req: AuthRequest, res: Response) => {
  const batchId = parseInt(req.params.batch_id as string, 10);

  try {
    // Verify batch belongs to a course the staff member owns
    const batch = await prisma.course_batches.findUnique({
      where: { id: batchId },
      include: { courses: true }
    });

    if (!batch) return res.status(404).json({ detail: 'Batch not found' });
    if (batch.courses?.staff_id !== req.user.id) {
      return res.status(403).json({ detail: 'This batch does not belong to your course' });
    }

    // Fetch enrollments with student info and profiles
    const enrollments = await prisma.enrollments.findMany({
      where: { batch_id: batchId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            is_active: true,
            created_at: true,
            student_profile: true
          }
        }
      }
    });

    const students = enrollments.map(e => ({
      enrollment_id: e.id,
      enrollment_date: e.enrollment_date,
      student: e.users ? {
        id: e.users.id,
        full_name: e.users.full_name,
        email: e.users.email,
        phone_number: e.users.phone_number,
        is_active: e.users.is_active,
        profile: e.users.student_profile ? {
          enrollment_year: e.users.student_profile.enrollment_year,
          current_semester: e.users.student_profile.current_semester,
          branch: e.users.student_profile.branch
        } : null
      } : null
    }));

    return res.json({
      batch: {
        id: batch.id,
        semester: batch.semester,
        section: batch.section,
        year: batch.year,
        status: batch.status,
        course_title: batch.courses?.title
      },
      students
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/staff/batches/:batch_id/progress
 * Returns content completion progress for all students in a batch.
 * Scoped to the staff member's courses.
 */
export const getBatchProgress = async (req: AuthRequest, res: Response) => {
  const batchId = parseInt(req.params.batch_id as string, 10);

  try {
    // Ownership check
    const batch = await prisma.course_batches.findUnique({
      where: { id: batchId },
      include: { courses: true, batch_content: true }
    });

    if (!batch) return res.status(404).json({ detail: 'Batch not found' });
    if (batch.courses?.staff_id !== req.user.id) {
      return res.status(403).json({ detail: 'This batch does not belong to your course' });
    }

    // Get all enrolled students
    const enrollments = await prisma.enrollments.findMany({
      where: { batch_id: batchId },
      include: {
        users: { select: { id: true, full_name: true, email: true } }
      }
    });

    // For each student, compute completion percentage
    const totalContent = batch.batch_content.length;
    const contentIds = batch.batch_content.map(c => c.id);

    const studentProgress = await Promise.all(
      enrollments.map(async (e) => {
        if (!e.users) return null;

        const completedCount = await prisma.lesson_progress.count({
          where: {
            user_id: e.users.id,
            batch_content_id: { in: contentIds },
            is_completed: true
          }
        });

        return {
          student_id: e.users.id,
          full_name: e.users.full_name,
          email: e.users.email,
          completed: completedCount,
          total: totalContent,
          percentage: totalContent > 0 ? Math.round((completedCount / totalContent) * 100) : 0
        };
      })
    );

    return res.json({
      batch_id: batch.id,
      course_title: batch.courses?.title,
      semester: batch.semester,
      section: batch.section,
      year: batch.year,
      progress: studentProgress.filter(Boolean)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// NEW: Batch Admissions
// ============================================================

export const admitToBatch = async (req: AuthRequest, res: Response) => {
  const { batch_id, student_ids } = req.body;
  if (!batch_id || !student_ids || !Array.isArray(student_ids)) {
    return res.status(400).json({ detail: 'batch_id and array of student_ids required' });
  }

  try {
    const batch = await prisma.course_batches.findUnique({
      where: { id: parseInt(batch_id, 10) },
      include: { courses: true }
    });
    if (!batch) return res.status(404).json({ detail: 'Batch not found' });
    if (batch.courses?.staff_id !== req.user.id) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }

    const created = await Promise.all(
      student_ids.map(async (student_id: number) => {
        const existing = await prisma.enrollments.findFirst({
          where: { user_id: student_id, batch_id: batch.id }
        });
        if (existing) return existing;

        return prisma.enrollments.create({
          data: {
            user_id: student_id,
            batch_id: batch.id,
            enrollment_date: new Date()
          }
        });
      })
    );
    return res.status(201).json({ message: 'Students admitted', created });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// NEW: Assignment Verification
// ============================================================

export const getStaffAssignments = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Fetch all courses for the staff, including batches, students, standard content items, and batch-specific content items
    const courses = await prisma.courses.findMany({
      where: { staff_id: req.user.id },
      include: {
        course_batches: {
          include: {
            enrollments: true,
            batch_content: {
              where: { type: 'ASSIGNMENT' },
              include: {
                submissions: { include: { users: true } }
              }
            }
          }
        },
        modules: {
          include: {
            content_items: {
              where: { type: { in: ['assignment', 'quiz', 'QUIZ'] } },
              include: {
                submissions: { include: { users: true } }
              }
            }
          }
        }
      }
    });

    const result: any[] = [];

    courses.forEach(course => {
      const standardTasks = course.modules.flatMap(m => m.content_items);
      const allSubmissionsMap = new Map();

      // Collect all standard submissions
      standardTasks.forEach(task => {
        task.submissions.forEach(sub => {
          allSubmissionsMap.set(sub.id, { ...sub, task_id: task.id, task_title: task.title });
        });
      });

      const processedSubmissionIds = new Set();

      // Process each batch
      course.course_batches.forEach(batch => {
        const batchStudentIds = new Set(batch.enrollments.map(e => e.student_id));
        const batchTasksMap = new Map();

        // Add standard tasks filtered by this batch's students
        standardTasks.forEach(task => {
          const batchSubmissions = task.submissions.filter(sub => batchStudentIds.has(sub.user_id));
          if (batchSubmissions.length > 0) {
            batchSubmissions.forEach(sub => processedSubmissionIds.add(sub.id));
            batchTasksMap.set(`std-${task.id}`, {
              task_id: task.id,
              task_title: task.title,
              submitted: batchSubmissions.map(sub => ({
                submission_id: sub.id,
                student_id: sub.user_id,
                student_name: sub.users?.full_name,
                drive_search_link: sub.drive_link,
                status: sub.status === 'Verified' ? 'Verified' : 'Pending',
                submitted_at: sub.submitted_at?.toISOString().split('T')[0]
              })),
              pending: []
            });
          }
        });

        // Add legacy batch-specific tasks
        batch.batch_content.forEach(task => {
          batchTasksMap.set(`batch-${task.id}`, {
            task_id: task.id,
            task_title: task.title,
            submitted: task.submissions.map(sub => ({
              submission_id: sub.id,
              student_id: sub.user_id,
              student_name: sub.users?.full_name,
              drive_search_link: sub.drive_link,
              status: sub.status === 'Verified' ? 'Verified' : 'Pending',
              submitted_at: sub.submitted_at?.toISOString().split('T')[0]
            })),
            pending: []
          });
        });

        if (batchTasksMap.size > 0) {
          result.push({
            course_id: `batch-${batch.id}`,
            course_title: `${course.title} (Sem ${batch.semester} - Sec ${batch.section})`,
            assignment_tasks: Array.from(batchTasksMap.values())
          });
        }
      });

      // Handle submissions not belonging to any active batch (Unassigned/Generic)
      const unassignedTasksMap = new Map();
      standardTasks.forEach(task => {
        const unassignedSubmissions = task.submissions.filter(sub => !processedSubmissionIds.has(sub.id));
        if (unassignedSubmissions.length > 0) {
          unassignedTasksMap.set(`std-${task.id}`, {
            task_id: task.id,
            task_title: task.title,
            submitted: unassignedSubmissions.map(sub => ({
              submission_id: sub.id,
              student_id: sub.user_id,
              student_name: sub.users?.full_name,
              drive_search_link: sub.drive_link,
              status: sub.status === 'Verified' ? 'Verified' : 'Pending',
              submitted_at: sub.submitted_at?.toISOString().split('T')[0]
            })),
            pending: []
          });
        }
      });

      if (unassignedTasksMap.size > 0) {
        result.push({
          course_id: `course-${course.id}-unassigned`,
          course_title: `${course.title} (Unassigned / General)`,
          assignment_tasks: Array.from(unassignedTasksMap.values())
        });
      }
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const verifyAssignment = async (req: AuthRequest, res: Response) => {
  const submissionId = parseInt(req.params.submissionId as string, 10);
  try {
    const submission = await prisma.submissions.findUnique({
      where: { id: submissionId },
      include: { 
        batch_content: { include: { course_batches: { include: { courses: true } } } },
        content_items: { include: { modules: { include: { courses: true } } } }
      }
    });

    if (!submission) return res.status(404).json({ detail: 'Not found' });
    
    const staffIdFromBatch = submission.batch_content?.course_batches?.courses?.staff_id;
    const staffIdFromCourse = submission.content_items?.modules?.courses?.staff_id;
    const ownerStaffId = staffIdFromBatch || staffIdFromCourse;

    if (ownerStaffId !== req.user.id) {
      return res.status(403).json({ detail: 'Unauthorized' });
    }

    await prisma.submissions.update({
      where: { id: submissionId },
      data: { status: 'Verified' }
    });
    return res.json({ message: 'Verified' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal error' });
  }
};
