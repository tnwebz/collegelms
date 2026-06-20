import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { config } from '../config';
import { sendCredentialsEmail } from '../services/email.service';

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, name, role, phone_number } = req.body;

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.users.create({
      data: {
        email,
        hashed_password: hashedPassword,
        full_name: name,
        role,
        phone_number,
        is_active: true,
        created_at: new Date()
      }
    });

    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
    const custom_subject = "Welcome to St. Joseph's College! Verify your account";
    const custom_body = `Hello ${name},\n\nWelcome to St. Joseph's College!\n\nYour Account Status: ACTIVE\n\n(If you need an OTP for verification, here it is: ${otp_code})\n\nHappy Learning!`;

    try {
      await sendCredentialsEmail(email, name, null, custom_subject, custom_body);
    } catch (error: any) {
      console.error(`❌ Email Failed: ${error}`);
      return res.status(500).json({ detail: `User created, but Email Failed: ${error.message}` });
    }

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  // FastAPI OAuth2PasswordRequestForm sends x-www-form-urlencoded with 'username' and 'password'
  const username = req.body.username || req.body.email;
  const password = req.body.password;

  try {
    const user = await prisma.users.findFirst({ 
      where: { 
        OR: [
          { email: username },
          { login_id: username }
        ] 
      } 
    });
    
    if (!user || !user.hashed_password) {
      return res.status(401).json({ detail: 'Incorrect credentials' });
    }

    const pwdMatch = await bcrypt.compare(password, user.hashed_password);
    
    if (!pwdMatch) {
      return res.status(401).json({ detail: 'Incorrect email or password' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ detail: 'Account deactivated. Contact support.' });
    }

    // Update last_login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    const payload = { sub: user.email || user.login_id, role: user.role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: `${config.jwtExpiresIn}m` });

    return res.json({
      access_token: token,
      token_type: 'bearer',
      role: user.role
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const loginOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    // In a real app, verify OTP against DB or Redis. 
    // Here we just check if it's a valid length or hardcoded '123456' for demo
    if (!otp || otp.length < 4) {
      return res.status(401).json({ detail: 'Invalid OTP' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ detail: 'Account deactivated.' });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    const payload = { sub: user.email, role: user.role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: `${config.jwtExpiresIn}m` });

    return res.json({
      access_token: token,
      token_type: 'bearer',
      role: user.role
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
