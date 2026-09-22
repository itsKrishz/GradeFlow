import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';
import { ProcessingState, SubmissionStatus } from '@prisma/client';

const createSubmissionSchema = z.object({
  assignmentId: z.string().uuid('Valid assignment ID is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.string().min(1, 'File size is required (e.g. 2.4 MB)'),
  fileUrl: z.string().optional(),
  fileText: z.string().optional(),
});

/**
 * POST /api/v1/submissions
 * Student submits an assignment (handles new submission or updates existing one)
 */
export async function createSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const student = req.user!;

    if (student.role !== 'STUDENT') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only students can submit assignments.',
      });
      return;
    }

    const parseResult = createSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid submission data',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { assignmentId, fileName, fileSize, fileUrl, fileText } = parseResult.data;

    // Check that assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      res.status(404).json({
        error: 'NotFound',
        message: `Assignment with ID '${assignmentId}' not found.`,
      });
      return;
    }

    // Verify student is enrolled in the course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: assignment.courseId,
          studentId: student.id,
        },
      },
    });

    if (!enrollment) {
      res.status(403).json({
        error: 'Forbidden',
        message: `You are not enrolled in '${assignment.course.code}'. Please enroll to submit assignments.`,
      });
      return;
    }

    // Upsert submission (create new or update if previously submitted)
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        fileName,
        fileSize,
        fileUrl: fileUrl || null,
        fileText: fileText || null,
        status: SubmissionStatus.SUBMITTED,
        processingState: ProcessingState.PENDING,
        submittedAt: new Date(),
      },
      create: {
        assignmentId,
        studentId: student.id,
        fileName,
        fileSize,
        fileUrl: fileUrl || null,
        fileText: fileText || null,
        status: SubmissionStatus.SUBMITTED,
        processingState: ProcessingState.PENDING,
      },
      include: {
        assignment: {
          select: { title: true, courseId: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Assignment submitted successfully for '${submission.assignment.title}'.`,
      submission,
    });
  } catch (error: any) {
    console.error('[Create Submission Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to process submission.',
    });
  }
}

/**
 * GET /api/v1/submissions
 * Query submissions (Instructors see class roster for their assignments; Students see their own)
 */
export async function getSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { assignmentId, courseId } = req.query;

    const whereClause: any = {};

    if (user.role === 'STUDENT') {
      whereClause.studentId = user.id;
      if (assignmentId && typeof assignmentId === 'string') {
        whereClause.assignmentId = assignmentId;
      }
    } else {
      // Teacher or Admin
      if (assignmentId && typeof assignmentId === 'string') {
        whereClause.assignmentId = assignmentId;
      }
      if (courseId && typeof courseId === 'string') {
        whereClause.assignment = { courseId };
      }
      if (user.role === 'TEACHER') {
        whereClause.assignment = {
          ...whereClause.assignment,
          course: { teacherId: user.id },
        };
      }
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, email: true, department: true },
        },
        assignment: {
          select: { id: true, title: true, totalMarks: true, courseId: true },
        },
        evaluation: {
          select: {
            id: true,
            totalScore: true,
            percentage: true,
            grade: true,
            feedback: true,
            published: true,
            evaluatedAt: true,
          },
        },
        similarityReport: {
          select: {
            id: true,
            overallScore: true,
            threshold: true,
            flagged: true,
            matchedSource: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error: any) {
    console.error('[Get Submissions Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve submissions.',
    });
  }
}

/**
 * GET /api/v1/submissions/:submissionId
 * Retrieve detailed submission record with full evaluation breakdown and similarity match
 */
export async function getSubmissionById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const submissionId = req.params.submissionId as string;
    const user = req.user!;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: { id: true, name: true, email: true, department: true },
        },
        assignment: {
          include: {
            course: {
              select: { id: true, code: true, name: true, teacherId: true },
            },
            rubricCriteria: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        evaluation: true,
        similarityReport: true,
      },
    });

    if (!submission) {
      res.status(404).json({
        error: 'NotFound',
        message: `Submission with ID '${submissionId}' not found.`,
      });
      return;
    }

    // Role-based privacy enforcement
    if (user.role === 'STUDENT' && submission.studentId !== user.id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view other students’ submissions.',
      });
      return;
    }

    if (
      user.role === 'TEACHER' &&
      submission.assignment.course.teacherId !== user.id
    ) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view submissions for courses that you teach.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      submission,
    });
  } catch (error: any) {
    console.error('[Get Submission By ID Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve submission details.',
    });
  }
}
