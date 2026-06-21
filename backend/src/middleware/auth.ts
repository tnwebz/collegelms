import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    const email = payload.sub;
    
    if (!email) {
      return res.status(401).json({ detail: 'Invalid session' });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Session expired or invalid' });
  }
};

export const requireSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await authenticate(req, res, () => {
    if (req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ detail: '⛔ Access Forbidden: Super Admin Only' });
    }
    next();
  });
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await authenticate(req, res, () => {
    if (req.user?.role !== 'HOD') {
      return res.status(403).json({ detail: '⛔ Access Forbidden: HOD Only' });
    }
    next();
  });
};

export const requireStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await authenticate(req, res, () => {
    if (req.user?.role !== 'STAFF' && req.user?.role !== 'HOD') {
      return res.status(403).json({ detail: '⛔ Access Forbidden: Staff Only' });
    }
    next();
  });
};

// Legacy alias — routes still referencing requireInstructor will now check for STAFF or HOD
export const requireInstructor = requireStaff;

export const requireStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await authenticate(req, res, () => {
    if (req.user?.role !== 'STUDENT') {
      return res.status(403).json({ detail: '⛔ Access Forbidden: Students Only' });
    }
    next();
  });
};
