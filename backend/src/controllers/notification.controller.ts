import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    return res.json(notifications);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const markNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notifications.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true }
    });
    return res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  const notifId = parseInt(req.params.id as string, 10);
  try {
    const notif = await prisma.notifications.findUnique({ where: { id: notifId } });
    if (!notif) return res.status(404).json({ detail: 'Notification not found' });
    if (notif.user_id !== req.user.id) return res.status(403).json({ detail: 'Not your notification' });

    await prisma.notifications.delete({ where: { id: notifId } });
    return res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const sendNotification = async (req: AuthRequest, res: Response) => {
  const { title, message, target_type, target_id, user_ids } = req.body;
  try {
    let finalUserIds: number[] = [];

    if (user_ids && user_ids.length > 0) {
      finalUserIds = user_ids;
    } else if (target_type === 'batch' && target_id) {
      const enrollments = await prisma.enrollments.findMany({ where: { batch_id: parseInt(target_id, 10) }});
      finalUserIds = enrollments.map((e: any) => e.user_id).filter((id: any) => id !== null) as number[];
    } else if (target_type === 'course' && target_id) {
      const batches = await prisma.course_batches.findMany({ where: { course_id: parseInt(target_id, 10) }});
      const batchIds = batches.map((b: any) => b.id);
      const enrollments = await prisma.enrollments.findMany({ where: { batch_id: { in: batchIds } }});
      finalUserIds = enrollments.map((e: any) => e.user_id).filter((id: any) => id !== null) as number[];
    } else if (target_type === 'student' && target_id) {
      finalUserIds = [parseInt(target_id, 10)];
    } else {
      const students = await prisma.users.findMany({ where: { role: 'STUDENT' } });
      finalUserIds = students.map((s: any) => s.id);
    }

    finalUserIds = Array.from(new Set(finalUserIds));

    for (const uid of finalUserIds) {
      await prisma.notifications.create({
        data: {
          user_id: uid,
          title: title || 'Announcement',
          message,
          is_read: false,
          created_at: new Date()
        }
      });
    }

    return res.json({ message: 'Notifications sent' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
