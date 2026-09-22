import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';

const rubricCriterionSchema = z.object({
  title: z.string().min(2, 'Criterion title is required'),
  description: z.string().min(2, 'Criterion description is required'),
  maxMarks: z.number().int().positive('Max marks must be greater than 0'),
});

const createAssignmentSchema = z.object({
  courseId: z.string().uuid('Valid course ID is required'),
  title: z.string().min(3, 'Assignment title must be at least 3 characters'),
  description: z.string().min(5, 'Assignment description is required'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid due date is required (ISO 8601)',
  }),
  dueTime: z.string().optional().default('23:59'),
  totalMarks: z.number().int().positive().optional().default(100),
  acceptedFileTypes: z.array(z.string()).optional().default(['pdf', 'sql', 'zip']),
  rubricCriteria: z.array(rubricCriterionSchema).optional().default([]),
});

/**
 * GET /api/v1/assignments
 * Query assignments optionally filtered by courseId, including submission status
 */
export async function getAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { courseId } = req.query;

    const whereClause: any = {};

    if (courseId && typeof courseId === 'string') {
      whereClause.courseId = courseId;
    } else if (user.role === 'TEACHER') {
      whereClause.course = { teacherId: user.id };
    } else if (user.role === 'STUDENT') {
      whereClause.course = {
        enrollments: { some: { studentId: user.id } },
      };
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
        rubricCriteria: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { submissions: true },
        },
        // For students, include their individual submission
        ...(user.role === 'STUDENT' && {
          submissions: {
            where: { studentId: user.id },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              processingState: true,
              evaluation: {
                select: { totalScore: true, grade: true, published: true },
              },
            },
          },
        }),
      },
      orderBy: { dueDate: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error: any) {
    console.error('[Get Assignments Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve assignments.',
    });
  }
}

/**
 * GET /api/v1/assignments/:assignmentId
 * Retrieve detailed assignment information including rubrics
 */
export async function getAssignmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const assignmentId = req.params.assignmentId as string;
    const user = req.user!;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: { id: true, code: true, name: true, teacherId: true },
        },
        rubricCriteria: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { submissions: true },
        },
        ...(user.role === 'STUDENT' && {
          submissions: {
            where: { studentId: user.id },
            include: {
              evaluation: true,
            },
          },
        }),
      },
    });

    if (!assignment) {
      res.status(404).json({
        error: 'NotFound',
        message: `Assignment with ID '${assignmentId}' not found.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error: any) {
    console.error('[Get Assignment By ID Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve assignment.',
    });
  }
}

/**
 * POST /api/v1/assignments
 * Create a new assignment with nested rubric criteria
 */
export async function createAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid assignment input',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      courseId,
      title,
      description,
      dueDate,
      dueTime,
      totalMarks,
      acceptedFileTypes,
      rubricCriteria,
    } = parseResult.data;

    // Verify course exists and belongs to this teacher (or user is ADMIN)
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      res.status(404).json({
        error: 'NotFound',
        message: `Course with ID '${courseId}' not found.`,
      });
      return;
    }

    if (req.user!.role !== 'ADMIN' && course.teacherId !== req.user!.id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only create assignments for courses that you teach.',
      });
      return;
    }

    // Create assignment and nested rubric criteria in a single atomic transaction
    const newAssignment = await prisma.assignment.create({
      data: {
        courseId,
        title,
        description,
        dueDate: new Date(dueDate),
        dueTime,
        totalMarks,
        acceptedFileTypes,
        rubricCriteria: {
          create: rubricCriteria.map((criterion, idx) => ({
            title: criterion.title,
            description: criterion.description,
            maxMarks: criterion.maxMarks,
            orderIndex: idx,
          })),
        },
      },
      include: {
        rubricCriteria: {
          orderBy: { orderIndex: 'asc' },
        },
        course: {
          select: { code: true, name: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Assignment '${newAssignment.title}' created successfully.`,
      assignment: newAssignment,
    });
  } catch (error: any) {
    console.error('[Create Assignment Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to create assignment.',
    });
  }
}

/**
 * DELETE /api/v1/assignments/:assignmentId
 * Delete an assignment and cascade remove its rubrics and submissions
 */
export async function deleteAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const assignmentId = req.params.assignmentId as string;
    const user = req.user!;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: { select: { teacherId: true } },
      },
    });

    if (!assignment) {
      res.status(404).json({
        error: 'NotFound',
        message: `Assignment with ID '${assignmentId}' not found.`,
      });
      return;
    }

    if (user.role !== 'ADMIN' && assignment.course.teacherId !== user.id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete assignments for courses you teach.',
      });
      return;
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    res.status(200).json({
      success: true,
      message: `Assignment '${assignment.title}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error('[Delete Assignment Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to delete assignment.',
    });
  }
}
