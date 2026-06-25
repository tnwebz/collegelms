import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      include: {
        student_profile: true,
        staff_profile: true,
        hod_profile: true
      }
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

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, email, phone_number, address, designation, password } = req.body;
    let profile_picture = undefined;

    // Handle uploaded file path if exists
    if (req.file) {
      profile_picture = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ detail: 'User not found' });

    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (address !== undefined) updateData.address = address;
    if (profile_picture !== undefined) updateData.profile_picture = profile_picture;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.hashed_password = await bcrypt.hash(password, salt);
    }

    // Update base user
    if (Object.keys(updateData).length > 0) {
      await prisma.users.update({
        where: { id: req.user.id },
        data: updateData
      });
    }

    // Update specific role profiles if applicable
    if (user.role === 'STAFF' && designation !== undefined) {
      await prisma.staff_profiles.update({
        where: { user_id: req.user.id },
        data: { designation }
      });
    }

    return res.json({ message: 'Profile updated successfully', profile_picture });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
