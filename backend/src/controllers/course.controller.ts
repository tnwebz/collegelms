import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// COURSE BLUEPRINT ENDPOINTS (Staff manages templates)
// ============================================================

// GET /courses - list courses
export const listCourses = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role === 'STAFF' || req.user.role === 'HOD') {
      const courses = await prisma.courses.findMany({
        where: req.user.role === 'HOD' ? {} : { staff_id: req.user.id },
        include: { course_batches: true },
        orderBy: { id: 'desc' }
      });
      return res.json(courses);
    }
    // Students see all published courses
    const courses = await prisma.courses.findMany({
      where: { is_published: true },
      orderBy: { id: 'desc' }
    });
    return res.json(courses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// GET /courses/:course_id - single course info with its batches
export const getCourseDetails = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      include: { course_batches: true }
    });
    if (!course) return res.status(404).json({ detail: 'Course not found' });
    return res.json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// POST /courses - create course blueprint (Staff)
export const createCourse = async (req: AuthRequest, res: Response) => {
  const { title, description, image_url, course_type, language, department, academic_year, semester, sections, academic_batch } = req.body;
  try {
    const course = await prisma.courses.create({
      data: {
        title,
        description,
        image_url,
        is_published: true,
        staff_id: req.user.id,
        course_type: course_type || 'regular',
        language: language || 'en',
        department: department || null,
        academic_year: academic_year || null,
        semester: semester ? parseInt(semester, 10) : null,
        sections: sections || [],
        academic_batch: academic_batch || null
      }
    });
    return res.status(201).json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// PATCH /courses/:course_id/details - update course blueprint
export const updateCourseDetails = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  const { title, description, image_url, language } = req.body;
  try {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ detail: 'Course not found' });
    if (course.staff_id !== req.user.id) return res.status(403).json({ detail: 'Not your course' });

    const updated = await prisma.courses.update({
      where: { id: courseId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(image_url !== undefined && { image_url }),
        ...(language !== undefined && { language })
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// BATCH-BASED ENROLLMENT (Students enroll in batches, NOT courses)
// ============================================================

// GET /my-courses - get student's enrolled batches (grouped by course)
export const getMyCourses = async (req: AuthRequest, res: Response) => {
  const reqSemester = req.query.semester ? parseInt(req.query.semester as string, 10) : null;
  try {
    const enrollments = await prisma.enrollments.findMany({
      where: { student_id: req.user.id },
      include: {
        course_batches: {
          include: { courses: true }
        }
      }
    });
    // Return the course info attached to the batch for each enrollment
    let results = enrollments
      .filter((e: any) => e.course_batches)
      .map((e: any) => ({
        enrollment_id: e.id,
        enrollment_date: e.enrollment_date,
        batch: {
          id: e.course_batches.id,
          semester: e.course_batches.semester,
          section: e.course_batches.section,
          status: e.course_batches.status
        },
        course: e.course_batches.courses
      }));
      
    if (reqSemester) {
      results = results.filter((r: any) => r.course?.semester === reqSemester || r.batch?.semester === reqSemester);
    }
      
    return res.json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// POST /enroll/:batch_id - enroll student in a specific batch
export const enrollInBatch = async (req: AuthRequest, res: Response) => {
  const batchId = parseInt(req.params.batch_id as string, 10);
  try {
    const batch = await prisma.course_batches.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ detail: 'Batch not found' });
    if (batch.status === 'COMPLETED') return res.status(400).json({ detail: 'Cannot enroll in a completed batch' });

    const existing = await prisma.enrollments.findFirst({
      where: { student_id: req.user.id, batch_id: batchId }
    });

    if (existing) {
      return res.json({ message: 'Already enrolled in this batch' });
    }

    await prisma.enrollments.create({
      data: {
        student_id: req.user.id,
        batch_id: batchId,
        enrollment_date: new Date()
      }
    });
    return res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// BATCH PLAYER (Student consumes batch content)
// ============================================================

// GET /batches/:batch_id/player - full player data with batch content + progress
export const getBatchPlayer = async (req: AuthRequest, res: Response) => {
  const batchId = parseInt(req.params.batch_id as string, 10);
  try {
    const batch = await prisma.course_batches.findUnique({
      where: { id: batchId },
      include: {
        courses: true,
        batch_content: { orderBy: { id: 'asc' } }
      }
    });

    if (!batch) return res.status(404).json({ detail: 'Batch not found' });

    // If student, verify enrollment
    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.enrollments.findFirst({
        where: { student_id: req.user.id, batch_id: batchId }
      });
      if (!enrollment) {
        return res.status(402).json({ detail: 'Not enrolled in this batch' });
      }
    }

    // Attach progress to each content item
    const contentWithProgress = await Promise.all(batch.batch_content.map(async (item: any) => {
      const progress = await prisma.lesson_progress.findFirst({
        where: { user_id: req.user.id, batch_content_id: item.id }
      });
      const submission = await prisma.submissions.findFirst({
        where: { user_id: req.user.id, batch_content_id: item.id }
      });
      return {
        ...item,
        is_completed: progress?.is_completed || false,
        violation_count: progress?.violation_count || 0,
        is_terminated: progress?.is_terminated || false,
        has_submission: !!submission
      };
    }));

    return res.json({
      batch: {
        id: batch.id,
        semester: batch.semester,
        section: batch.section,
        status: batch.status
      },
      course: batch.courses,
      content: contentWithProgress
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// LEGACY COURSE PLAYER (kept for backward compat with frontend)
// ============================================================

// GET /courses/:course_id/player - resolves via legacy modules
export const getCoursePlayer = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            content_items: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!course) return res.status(404).json({ detail: 'Course not found' });

    // Attach progress to each lesson
    const modulesWithProgress = await Promise.all(course.modules.map(async (mod: any) => {
      const lessonsWithProgress = await Promise.all(mod.content_items.map(async (item: any) => {
        return {
          ...item,
          url: item.content,
          is_completed: false,
          violation_count: 0,
          is_terminated: false,
          has_submission: false,
          instructions: item.instructions
        };
      }));
      return { ...mod, lessons: lessonsWithProgress };
    }));

    return res.json({
      ...course,
      modules: modulesWithProgress
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// CHALLENGES (remain course-level blueprints)
// ============================================================

// GET /courses/:course_id/challenges
export const getCourseChallenges = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const challenges = await prisma.course_challenges.findMany({
      where: { course_id: courseId }
    });

    const withProgress = await Promise.all(challenges.map(async (ch: any) => {
      const progress = await prisma.challenge_progress.findFirst({
        where: { user_id: req.user.id, challenge_id: ch.id }
      });
      return { ...ch, is_solved: progress?.is_solved || false };
    }));

    return res.json(withProgress);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// POST /challenges/:challenge_id/solve
export const solveChallenge = async (req: AuthRequest, res: Response) => {
  const challengeId = parseInt(req.params.challenge_id as string, 10);
  try {
    const existing = await prisma.challenge_progress.findFirst({
      where: { user_id: req.user.id, challenge_id: challengeId }
    });
    if (existing) {
      await prisma.challenge_progress.update({
        where: { id: existing.id },
        data: { is_solved: true, solved_at: new Date() }
      });
    } else {
      await prisma.challenge_progress.create({
        data: {
          user_id: req.user.id,
          challenge_id: challengeId,
          is_solved: true,
          solved_at: new Date()
        }
      });
    }
    return res.json({ message: 'Challenge solved!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// POST /courses/:course_id/claim-certificate
export const claimCertificate = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const existing = await prisma.user_certificates.findFirst({
      where: { user_id: req.user.id, course_id: courseId }
    });
    if (existing) {
      return res.json({ status: 'already_claimed', message: 'Certificate already generated', pdf_url: existing.pdf_url });
    }

    const certId = `CERT-${req.user.id}-${courseId}-${Date.now()}`;
    const cert = await prisma.user_certificates.create({
      data: {
        user_id: req.user.id,
        course_id: courseId,
        certificate_id: certId,
        issued_at: new Date(),
        pdf_url: null
      }
    });

    return res.json({ status: 'success', message: 'Certificate generated!', certificate_id: certId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// GET /generate-pdf/:course_id
export const generatePdf = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const cert = await prisma.user_certificates.findFirst({
      where: { user_id: req.user.id, course_id: courseId }
    });
    
    if (!cert) {
      return res.status(404).json({ detail: 'Certificate not found' });
    }

    return res.json({ pdf_url: cert.pdf_url || "https://dummy-pdf-url.com/cert.pdf" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// GET /courses/:course_id/modules
export const getCourseModules = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const mods = await prisma.modules.findMany({
      where: { course_id: courseId },
      orderBy: { order: 'asc' },
      include: {
        content_items: { orderBy: { order: 'asc' } }
      }
    });
    return res.json(mods);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// POST /courses/:course_id/modules
export const createCourseModule = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  const { title, order } = req.body;
  try {
    const newMod = await prisma.modules.create({
      data: {
        course_id: courseId,
        title,
        order: order || 1
      }
    });
    return res.json(newMod);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// PATCH /courses/:course_id/publish
export const publishCourse = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const updated = await prisma.courses.update({
      where: { id: courseId },
      data: { is_published: true }
    });
    return res.json({ message: 'Course published', course: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// POST /enroll/:course_id - Legacy wrapper to enroll student in the latest active batch of a course
export const enrollInCourse = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ detail: 'Course not found' });
    
    let batch = await prisma.course_batches.findFirst({
      where: { course_id: courseId, status: 'ACTIVE' },
      orderBy: { id: 'desc' }
    });

    if (!batch) {
      batch = await prisma.course_batches.create({
        data: {
          course_id: course.id,
          semester: 1,
          section: 'A',
          status: 'ACTIVE'
        }
      });
    }

    const existing = await prisma.enrollments.findFirst({
      where: { student_id: req.user.id, batch_id: batch.id }
    });

    if (existing) {
      return res.json({ message: 'Already enrolled in this course' });
    }

    await prisma.enrollments.create({
      data: {
        student_id: req.user.id,
        batch_id: batch.id,
        enrollment_date: new Date()
      }
    });
    return res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// ============================================================
// COURSE BUILDER / MANAGEMENT (STAFF/HOD)
// ============================================================

export const reorderModules = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  const { moduleIds } = req.body; // array of module IDs in new order
  try {
    for (let i = 0; i < moduleIds.length; i++) {
      await prisma.modules.update({
        where: { id: moduleIds[i] },
        data: { order: i }
      });
    }
    return res.json({ message: 'Modules reordered successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const getCourseStudents = async (req: AuthRequest, res: Response) => {
  const courseId = parseInt(req.params.course_id as string, 10);
  try {
    const { batch_year, department, section, semester } = req.query;

    const enrollments = await prisma.enrollments.findMany({
      where: {
        course_batches: { course_id: courseId },
        users: { is_active: true }
      },
      include: {
        users: { include: { student_profile: true } }
      }
    });

    let students = enrollments
      .filter((e: any) => e.users && e.users.role === 'STUDENT')
      .map((e: any) => ({
        enrollment_id: e.id,
        ...e.users,
      }));

    if (batch_year) students = students.filter((s: any) => s.student_profile?.batch_year === batch_year);
    if (department) students = students.filter((s: any) => s.student_profile?.branch === department);
    if (section) students = students.filter((s: any) => s.student_profile?.section === section);
    if (semester) students = students.filter((s: any) => s.student_profile?.current_semester === parseInt(semester as string, 10));

    return res.json(students);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const removeCourseStudent = async (req: AuthRequest, res: Response) => {
  const enrollmentId = parseInt(req.params.student_id as string, 10);
  try {
    await prisma.enrollments.delete({
      where: { id: enrollmentId }
    });
    return res.json({ message: 'Student removed from course successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

