import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() }).single('file');

// POST /content/:id/complete — toggles progress on batch_content
export const toggleContentComplete = async (req: AuthRequest, res: Response) => {
  const contentId = parseInt(req.params.id as string, 10);
  try {
    const existing = await prisma.lesson_progress.findFirst({
      where: { user_id: req.user.id, batch_content_id: contentId }
    });

    if (existing) {
      await prisma.lesson_progress.update({
        where: { id: existing.id },
        data: { is_completed: !existing.is_completed, completed_at: new Date() }
      });
      return res.json({ message: 'Progress toggled' });
    } else {
      await prisma.lesson_progress.create({
        data: {
          user_id: req.user.id,
          batch_content_id: contentId,
          is_completed: true,
          completed_at: new Date(),
          violation_count: 0,
          is_terminated: false
        }
      });
      return res.json({ message: 'Progress marked as complete' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// PATCH /content/:id — update a legacy content_item (kept for backward compat)
export const updateContentItem = async (req: AuthRequest, res: Response) => {
  const contentId = parseInt(req.params.id as string, 10);
  const { title, url } = req.body;
  try {
    const updated = await prisma.content_items.update({
      where: { id: contentId },
      data: {
        ...(title !== undefined && { title }),
        ...(url !== undefined && { content: url })
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// DELETE /content/:id — delete a legacy content_item
export const deleteContentItem = async (req: AuthRequest, res: Response) => {
  const contentId = parseInt(req.params.id as string, 10);
  try {
    await prisma.content_items.delete({ where: { id: contentId } });
    return res.json({ message: 'Content item deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// PATCH /modules/:id
export const updateModule = async (req: AuthRequest, res: Response) => {
  const moduleId = parseInt(req.params.id as string, 10);
  const { title } = req.body;
  try {
    const updated = await prisma.modules.update({
      where: { id: moduleId },
      data: { title }
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

// DELETE /modules/:id
export const deleteModule = async (req: AuthRequest, res: Response) => {
  const moduleId = parseInt(req.params.id as string, 10);
  try {
    await prisma.content_items.deleteMany({ where: { module_id: moduleId } });
    await prisma.modules.delete({ where: { id: moduleId } });
    return res.json({ message: 'Module deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const reorderModules = async (req: AuthRequest, res: Response) => {
  return res.json({ message: 'Modules reordered' });
};

export const reorderContentItems = async (req: AuthRequest, res: Response) => {
  return res.json({ message: 'Content items reordered' });
};

// POST /submit-assignment — now tracks against batch_content_id
export const submitAssignment = async (req: AuthRequest, res: Response) => {
  upload(req as any, res as any, async (err: any) => {
    if (err) {
      return res.status(500).json({ detail: 'Upload error' });
    }
    const { lesson_id } = req.body;
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ detail: 'File is required' });
    }

    const contentId = parseInt(lesson_id, 10);

    try {
      await prisma.submissions.create({
        data: {
          user_id: req.user.id,
          batch_content_id: contentId,
          drive_link: "local-upload-" + file.originalname,
          status: "submitted",
          submitted_at: new Date()
        }
      });

      // Also mark progress as complete
      const existing = await prisma.lesson_progress.findFirst({
        where: { user_id: req.user.id, batch_content_id: contentId }
      });
      if (existing) {
        await prisma.lesson_progress.update({
          where: { id: existing.id },
          data: { is_completed: true, completed_at: new Date() }
        });
      } else {
        await prisma.lesson_progress.create({
          data: {
            user_id: req.user.id,
            batch_content_id: contentId,
            is_completed: true,
            completed_at: new Date(),
            violation_count: 0,
            is_terminated: false
          }
        });
      }

      return res.json({ message: 'Assignment submitted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  });
};

// POST /content — Create a legacy content_item for the course builder
export const createContentItem = async (req: AuthRequest, res: Response) => {
  const { title, type, data_url, duration, is_mandatory, instructions, module_id, start_time, end_time, test_config } = req.body;
  try {
    const newItem = await prisma.content_items.create({
      data: {
        title,
        type,
        content: data_url,
        duration,
        is_mandatory,
        instructions,
        module_id,
        start_time: start_time ? new Date(start_time) : null,
        end_time: end_time ? new Date(end_time) : null,
        test_config
      }
    });
    return res.json(newItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
