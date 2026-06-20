import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { BatchStatus, ContentType } from '@prisma/client';

export const createBatch = async (req: AuthRequest, res: Response) => {
  const course_id = parseInt(req.params.course_id as string, 10);
  const { semester, section, year } = req.body;
  
  try {
    const batch = await prisma.course_batches.create({
      data: {
        course_id,
        semester: semester || 1,
        section: section || 'A',
        year: year ? parseInt(year, 10) : null,
        status: BatchStatus.ACTIVE
      }
    });
    return res.status(201).json(batch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const updateBatchStatus = async (req: AuthRequest, res: Response) => {
  const batch_id = parseInt(req.params.batch_id as string, 10);
  const { status } = req.body;
  
  if (status !== BatchStatus.ACTIVE && status !== BatchStatus.COMPLETED) {
    return res.status(400).json({ detail: 'Invalid status' });
  }

  try {
    const batch = await prisma.course_batches.update({
      where: { id: batch_id },
      data: { status }
    });
    return res.json(batch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const addBatchContent = async (req: AuthRequest, res: Response) => {
  const batch_id = parseInt(req.params.batch_id as string, 10);
  const { type, title, content_data, due_date } = req.body;
  
  let cType: ContentType = ContentType.VIDEO;
  if (type === 'ASSIGNMENT') cType = ContentType.ASSIGNMENT;
  if (type === 'TEST') cType = ContentType.TEST;

  try {
    const content = await prisma.batch_content.create({
      data: {
        batch_id,
        type: cType,
        title,
        content_data,
        due_date: due_date ? new Date(due_date) : null
      }
    });
    return res.status(201).json(content);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
