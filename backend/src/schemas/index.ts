import { z } from 'zod';

// --- USER SCHEMAS ---
export const UserBaseSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: z.string(), // "student", "instructor", "admin"
  phone_number: z.string().optional()
});

export const UserCreateSchema = UserBaseSchema.extend({
  password: z.string()
});

export const UserSchema = UserBaseSchema.extend({
  id: z.number(),
  is_active: z.boolean(),
  created_at: z.date()
});

// --- TOKEN SCHEMAS ---
export const TokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string()
});

export const TokenDataSchema = z.object({
  username: z.string().optional()
});

// --- COURSE SCHEMAS ---
export const CourseBaseSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.number()
});

export const CourseCreateSchema = CourseBaseSchema;

export const CourseSchema = CourseBaseSchema.extend({
  id: z.number(),
  instructor_id: z.number(),
  created_at: z.date()
});

// --- LESSON / CONTENT SCHEMAS ---
export const ContentItemBaseSchema = z.object({
  title: z.string(),
  type: z.string(), // "video", "assignment", "pdf"
  content: z.string().optional(),
  order: z.number()
});

export const ContentItemCreateSchema = ContentItemBaseSchema.extend({
  course_id: z.number()
});

export const ContentItemSchema = ContentItemBaseSchema.extend({
  id: z.number(),
  course_id: z.number(),
  is_completed: z.boolean().optional().default(false)
});
