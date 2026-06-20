import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getProctoringStatus = async (req: AuthRequest, res: Response) => {
  const lessonId = parseInt(req.params.id as string, 10);
  try {
    const progress = await prisma.lesson_progress.findFirst({
      where: { user_id: req.user.id, content_item_id: lessonId }
    });
    if (!progress) {
      return res.json({ is_terminated: false, violation_count: 0 });
    }
    return res.json({
      is_terminated: progress.is_terminated,
      violation_count: progress.violation_count
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const reportViolation = async (req: AuthRequest, res: Response) => {
  const { lesson_id } = req.body;
  const lessonId = parseInt(lesson_id, 10);
  try {
    let progress = await prisma.lesson_progress.findFirst({
      where: { user_id: req.user.id, content_item_id: lessonId }
    });

    if (!progress) {
      progress = await prisma.lesson_progress.create({
        data: {
          user_id: req.user.id,
          content_item_id: lessonId,
          violation_count: 1,
          is_terminated: false,
          is_completed: false
        }
      });
    } else {
      const newCount = (progress.violation_count || 0) + 1;
      const terminated = newCount >= 3;
      progress = await prisma.lesson_progress.update({
        where: { id: progress.id },
        data: {
          violation_count: newCount,
          is_terminated: terminated
        }
      });
    }

    return res.json({
      violation_count: progress.violation_count,
      status: progress.is_terminated ? "terminated" : "warning",
      remaining_attempts: Math.max(0, 3 - (progress.violation_count || 0))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
