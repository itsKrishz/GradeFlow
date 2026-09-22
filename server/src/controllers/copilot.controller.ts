import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/auth';
import { queryCopilot, draftAssignmentWithAI } from '../services/copilot.service';

const copilotQuerySchema = z.object({
  query: z.string().min(1, 'Query string cannot be empty'),
  courseId: z.string().uuid('Valid course ID is required').optional(),
  assignmentId: z.string().uuid('Valid assignment ID is required').optional(),
});

const draftAssignmentSchema = z.object({
  prompt: z.string().min(1, 'Assignment prompt is required'),
  courseId: z.string().uuid('Valid course ID is required').optional(),
  totalMarks: z.number().int().positive().optional(),
  title: z.string().optional(),
});

/**
 * POST /api/v1/copilot/query
 * Process a natural language instructor query with database metrics and copilot widgets
 */
export async function handleCopilotQuery(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const parseResult = copilotQuerySchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid copilot query parameters',
        details: parseResult.error.format(),
      });
      return;
    }

    const { query, courseId, assignmentId } = parseResult.data;

    const copilotResponse = await queryCopilot({
      teacherId: user.id,
      query,
      courseId,
      assignmentId,
    });

    res.status(200).json({
      success: true,
      data: copilotResponse,
    });
  } catch (error: any) {
    console.error('[Copilot Query Error]:', error);
    res.status(500).json({
      error: 'CopilotProcessingError',
      message: error.message || 'Failed to process copilot query.',
    });
  }
}

/**
 * POST /api/v1/copilot/draft-assignment
 * Generate structured assignment parameters and rubrics from an instructor prompt
 */
export async function handleDraftAssignment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user!;
    const parseResult = draftAssignmentSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid assignment draft parameters',
        details: parseResult.error.format(),
      });
      return;
    }

    const { prompt, courseId, totalMarks, title } = parseResult.data;

    const draft = await draftAssignmentWithAI({
      prompt,
      teacherId: user.id,
      courseId,
      totalMarks,
      title,
    });

    res.status(200).json({
      success: true,
      data: draft,
    });
  } catch (error: any) {
    console.error('[Copilot Draft Error]:', error);
    res.status(500).json({
      error: 'DraftGenerationError',
      message: error.message || 'Failed to generate assignment draft.',
    });
  }
}
