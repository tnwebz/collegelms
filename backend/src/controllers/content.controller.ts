import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { uploadDocument } from '../middleware/uploadMiddleware';

// POST /content/:id/complete — toggles progress on batch_content or content_items
export const toggleContentComplete = async (req: AuthRequest, res: Response) => {
  const contentId = parseInt(req.params.id as string, 10);
  try {
    const batchContentExists = await prisma.batch_content.findUnique({ where: { id: contentId } });
    const contentItemExists = await prisma.content_items.findUnique({ where: { id: contentId } });

    if (!batchContentExists && !contentItemExists) {
      return res.status(404).json({ detail: 'Content not found' });
    }

    const whereClause = batchContentExists 
      ? { user_id: req.user.id, batch_content_id: contentId }
      : { user_id: req.user.id, content_item_id: contentId };

    const existing = await prisma.lesson_progress.findFirst({
      where: whereClause
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
          batch_content_id: batchContentExists ? contentId : null,
          content_item_id: !batchContentExists ? contentId : null,
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
  uploadDocument(req as any, res as any, async (err: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ detail: 'Upload error' });
    }
    const { lesson_id, drive_link } = req.body;
    
    // Fallback: If no file uploaded, maybe it's a drive_link submission
    const file = (req as any).file;
    if (!file && !drive_link) {
      return res.status(400).json({ detail: 'File or Drive Link is required' });
    }

    const contentId = parseInt(lesson_id, 10);
    const submissionArtifact = file ? `/uploads/documents/${file.filename}` : drive_link;

    try {
      const batchContentExists = await prisma.batch_content.findUnique({ where: { id: contentId } });
      const contentItemExists = await prisma.content_items.findUnique({ where: { id: contentId } });

      if (!batchContentExists && !contentItemExists) {
        return res.status(404).json({ detail: 'Content not found' });
      }

      await prisma.submissions.create({
        data: {
          user_id: req.user.id,
          batch_content_id: batchContentExists ? contentId : null,
          content_item_id: !batchContentExists ? contentId : null,
          drive_link: submissionArtifact,
          status: "submitted",
          submitted_at: new Date()
        }
      });

      const whereClause = batchContentExists 
        ? { user_id: req.user.id, batch_content_id: contentId }
        : { user_id: req.user.id, content_item_id: contentId };

      // Also mark progress as complete
      const existing = await prisma.lesson_progress.findFirst({
        where: whereClause
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
            batch_content_id: batchContentExists ? contentId : null,
            content_item_id: !batchContentExists ? contentId : null,
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

export const createDirectVideoContentItem = async (req: AuthRequest, res: Response) => {
  const { title, duration, is_mandatory, instructions, module_id, start_time, end_time } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ detail: 'No video file provided' });
  }

  const videoPath = `/uploads/videos/${req.file.filename}`;

  try {
    const newItem = await prisma.content_items.create({
      data: {
        title: title || 'Direct Video',
        type: 'direct_video',
        content: videoPath,
        duration: duration ? parseInt(duration) : null,
        is_mandatory: is_mandatory === 'true',
        instructions,
        module_id: parseInt(module_id, 10),
        start_time: start_time ? new Date(start_time) : null,
        end_time: end_time ? new Date(end_time) : null,
      }
    });
    return res.json(newItem);
  } catch (error) {
    console.error('Error saving direct video:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const createDirectDocumentContentItem = async (req: AuthRequest, res: Response) => {
  const { title, type, is_mandatory, instructions, module_id, start_time, end_time } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ detail: 'No document file provided' });
  }

  const documentPath = `/uploads/documents/${req.file.filename}`;
  // Type will generally be 'direct_document' or 'assignment_document'
  const docType = type || 'direct_document';

  try {
    const newItem = await prisma.content_items.create({
      data: {
        title: title || 'Document',
        type: docType,
        content: documentPath,
        is_mandatory: is_mandatory === 'true',
        instructions,
        module_id: parseInt(module_id, 10),
        start_time: start_time ? new Date(start_time) : null,
        end_time: end_time ? new Date(end_time) : null,
      }
    });
    return res.json(newItem);
  } catch (error) {
    console.error('Error saving direct document:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
