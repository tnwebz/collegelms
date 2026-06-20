import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getActiveLiveSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.live_sessions.findMany({
      where: { is_active: true }
    });
    return res.json(sessions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
