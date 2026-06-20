import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id }
    });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    // Return user without hashed password
    const { hashed_password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { new_password } = req.body;
  if (!new_password) {
    return res.status(400).json({ detail: 'new_password is required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await prisma.users.update({
      where: { id: req.user.id },
      data: { hashed_password: hashedPassword }
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
