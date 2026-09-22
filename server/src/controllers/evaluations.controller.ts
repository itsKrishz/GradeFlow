import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';
import { NotificationType, SubmissionStatus } from '@prisma/client';

const saveEvaluationSchema = z.object({
  submissionId: z.string().uuid('Valid submission ID is required'),
  totalScore: z.number().min(0, 'Score cannot be negative'),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  grade: z.string().min(1, 'Grade is required (e.g. A, B, C)'),
  feedback: z.string().min(1, 'Evaluation feedback is required'),
  rubricScores: z.any(), // Array or Record representing criterion-by-criterion breakdown
  aiAssisted: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
});

const updateSimilaritySchema = z.object({
  submissionId: z.string().uuid('Valid submission ID is required'),
  overallScore: z.number().min(0).max(100),
  threshold: z.number().optional().default(30.0),
  flagged: z.boolean(),
  matchedSource: z.string().optional().nullable(),
  matchedChunks: z.any().optional().nullable(),
});

/**
 * GET /api/v1/evaluations
 * Query evaluations filtered by assignmentId or submissionId with RBAC scoping
 */
export async function getEvaluations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { assignmentId, submissionId } = req.query;

    const whereClause: any = {};

    if (submissionId && typeof submissionId === 'string') {
      whereClause.submissionId = submissionId;
    }
    if (assignmentId && typeof assignmentId === 'string') {
      whereClause.submission = { assignmentId };
    }

    if (user.role === 'STUDENT') {
      whereClause.submission = {
        ...whereClause.submission,
        studentId: user.id,
      };
      // Students only see published evaluations
      whereClause.published = true;
    } else if (user.role === 'TEACHER') {
      whereClause.submission = {
        ...whereClause.submission,
        assignment: { course: { teacherId: user.id } },
      };
    }

    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        submission: {
          select: {
            id: true,
            fileName: true,
            status: true,
            submittedAt: true,
            student: { select: { id: true, name: true, email: true } },
            assignment: { select: { id: true, title: true, totalMarks: true } },
          },
        },
        evaluator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { evaluatedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: evaluations.length,
      evaluations,
    });
  } catch (error: any) {
    console.error('[Get Evaluations Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve evaluations.',
    });
  }
}

/**
 * GET /api/v1/evaluations/submission/:submissionId
 * Retrieve detailed evaluation & similarity report for a specific submission
 */
export async function getEvaluationBySubmissionId(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const submissionId = req.params.submissionId as string;
    const user = req.user!;

    const evaluation = await prisma.evaluation.findUnique({
      where: { submissionId },
      include: {
        submission: {
          include: {
            student: { select: { id: true, name: true, email: true, department: true } },
            assignment: {
              include: {
                course: { select: { id: true, code: true, name: true, teacherId: true } },
                rubricCriteria: { orderBy: { orderIndex: 'asc' } },
              },
            },
            similarityReport: true,
          },
        },
        evaluator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!evaluation) {
      res.status(404).json({
        error: 'NotFound',
        message: `Evaluation for submission ID '${submissionId}' not found.`,
      });
      return;
    }

    // Privacy & permission check
    if (user.role === 'STUDENT') {
      if (evaluation.submission.studentId !== user.id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You are not authorized to view other students’ evaluations.',
        });
        return;
      }
      if (!evaluation.published) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Evaluation results for this submission have not yet been published by the instructor.',
        });
        return;
      }
    } else if (
      user.role === 'TEACHER' &&
      evaluation.submission.assignment.course.teacherId !== user.id
    ) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view evaluations for courses that you teach.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    console.error('[Get Evaluation By Submission ID Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve evaluation details.',
    });
  }
}

/**
 * POST /api/v1/evaluations
 * Save or publish an instructor evaluation with rubric scores and automated student notification
 */
export async function saveEvaluation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = saveEvaluationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid evaluation data',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      submissionId,
      totalScore,
      percentage,
      grade,
      feedback,
      rubricScores,
      aiAssisted,
      published,
    } = parseResult.data;

    // Verify submission exists and instructor owns the course
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { course: true },
        },
      },
    });

    if (!submission) {
      res.status(404).json({
        error: 'NotFound',
        message: `Submission with ID '${submissionId}' not found.`,
      });
      return;
    }

    if (
      req.user!.role !== 'ADMIN' &&
      submission.assignment.course.teacherId !== req.user!.id
    ) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only evaluate submissions for courses that you teach.',
      });
      return;
    }

    // Upsert Evaluation
    const evaluation = await prisma.evaluation.upsert({
      where: { submissionId },
      update: {
        totalScore,
        percentage,
        grade,
        feedback,
        rubricScores,
        aiAssisted,
        published,
        evaluatedAt: new Date(),
      },
      create: {
        submissionId,
        evaluatorId: req.user!.id,
        totalScore,
        percentage,
        grade,
        feedback,
        rubricScores,
        aiAssisted,
        published,
      },
    });

    // Update submission status to GRADED
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.GRADED },
    });

    // If published, create an automated student notification
    if (published) {
      await prisma.notification.create({
        data: {
          userId: submission.studentId,
          title: 'Evaluation Published',
          message: `Your submission for '${submission.assignment.title}' has been evaluated: ${percentage.toFixed(1)}% (Grade: ${grade}).`,
          type: NotificationType.SUCCESS,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation saved successfully.',
      evaluation,
    });
  } catch (error: any) {
    console.error('[Save Evaluation Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to save evaluation.',
    });
  }
}

/**
 * PUT /api/v1/evaluations/similarity/:submissionId
 * Update similarity report details and flag/unflag submissions
 */
export async function updateSimilarityReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const submissionId = req.params.submissionId as string;

    const parseResult = updateSimilaritySchema.safeParse({
      submissionId,
      ...req.body,
    });

    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid similarity report data',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { overallScore, threshold, flagged, matchedSource, matchedChunks } =
      parseResult.data;

    // Verify submission exists and instructor owns the course
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { course: true },
        },
      },
    });

    if (!submission) {
      res.status(404).json({
        error: 'NotFound',
        message: `Submission with ID '${submissionId}' not found.`,
      });
      return;
    }

    if (
      req.user!.role !== 'ADMIN' &&
      submission.assignment.course.teacherId !== req.user!.id
    ) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update integrity reports for courses that you teach.',
      });
      return;
    }

    const similarityReport = await prisma.similarityReport.upsert({
      where: { submissionId },
      update: {
        overallScore,
        threshold,
        flagged,
        matchedSource,
        matchedChunks,
      },
      create: {
        submissionId,
        overallScore,
        threshold,
        flagged,
        matchedSource,
        matchedChunks,
      },
    });

    // Update submission status if flagged
    if (flagged) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.FLAGGED },
      });

      // Send instructor alert notification
      await prisma.notification.create({
        data: {
          userId: submission.assignment.course.teacherId,
          title: 'Academic Integrity Alert Flagged',
          message: `Submission ID '${submissionId}' was flagged for ${overallScore}% similarity against ${matchedSource || 'database'}.`,
          type: NotificationType.WARNING,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Similarity report updated successfully.',
      similarityReport,
    });
  } catch (error: any) {
    console.error('[Update Similarity Report Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to update similarity report.',
    });
  }
}

import { evaluateSubmissionWithAI, generateFeedbackFromScores } from '../services/ai-evaluator.service';

/**
 * POST /api/v1/evaluations/ai-evaluate/:submissionId
 * On-demand AI evaluation of a student submission against assignment rubrics
 */
export async function triggerAIEvaluation(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const submissionId = req.params.submissionId as string;
    const user = req.user!;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: true,
        assignment: {
          include: {
            course: true,
            rubricCriteria: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!submission) {
      res.status(404).json({ error: 'NotFound', message: 'Submission not found' });
      return;
    }

    if (user.role !== 'ADMIN' && submission.assignment.course.teacherId !== user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
      return;
    }

    const aiResult = await evaluateSubmissionWithAI({
      submissionText: submission.fileText || `[Document: ${submission.fileName}]`,
      assignmentTitle: submission.assignment.title,
      assignmentDescription: submission.assignment.description,
      rubricCriteria: submission.assignment.rubricCriteria,
      studentName: submission.student.name,
    });

    const evaluation = await prisma.evaluation.upsert({
      where: { submissionId },
      update: {
        totalScore: aiResult.totalScore,
        percentage: aiResult.percentage,
        grade: aiResult.grade,
        feedback: aiResult.overallFeedback,
        rubricScores: aiResult.rubricScores as any,
        aiAssisted: true,
        evaluatedAt: new Date(),
      },
      create: {
        submissionId,
        evaluatorId: user.id,
        totalScore: aiResult.totalScore,
        percentage: aiResult.percentage,
        grade: aiResult.grade,
        feedback: aiResult.overallFeedback,
        rubricScores: aiResult.rubricScores as any,
        aiAssisted: true,
        published: false,
      },
    });

    res.status(200).json({
      success: true,
      message: 'AI evaluation completed successfully.',
      evaluation,
      aiProvider: aiResult.provider,
    });
  } catch (error: any) {
    console.error('[Trigger AI Evaluation Error]:', error);
    res.status(500).json({ error: 'ServerError', message: 'AI evaluation failed.' });
  }
}

/**
 * POST /api/v1/evaluations/generate-feedback
 * Generates personalized, constructive feedback text given scores and criteria
 */
export async function generateAIFeedback(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { rubricScores, criteria, studentName } = req.body;

    if (!criteria || !Array.isArray(criteria)) {
      res.status(400).json({ error: 'ValidationError', message: 'Criteria list required' });
      return;
    }

    const feedback = generateFeedbackFromScores({
      rubricScores: rubricScores || {},
      criteria,
      studentName: studentName || 'Student',
    });

    res.status(200).json({
      success: true,
      feedback,
    });
  } catch (error: any) {
    console.error('[Generate AI Feedback Error]:', error);
    res.status(500).json({ error: 'ServerError', message: error.message });
  }
}
