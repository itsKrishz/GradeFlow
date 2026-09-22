import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';

const createCourseSchema = z.object({
  code: z.string().min(2, 'Course code is required (e.g. CS301)').toUpperCase().trim(),
  name: z.string().min(3, 'Course name must be at least 3 characters').trim(),
  semester: z.string().min(2, 'Semester is required (e.g. Fall 2026)').trim(),
  department: z.string().optional().default('Computer Science'),
});

/**
 * GET /api/v1/courses
 * List courses tailored to the user's role (enrolled courses for students, taught for instructors)
 */
export async function getCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;

    let courses;
    if (user.role === 'TEACHER') {
      courses = await prisma.course.findMany({
        where: { teacherId: user.id },
        include: {
          teacher: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { enrollments: true, assignments: true },
          },
        },
        orderBy: { code: 'asc' },
      });
    } else if (user.role === 'STUDENT') {
      courses = await prisma.course.findMany({
        where: {
          enrollments: {
            some: { studentId: user.id },
          },
        },
        include: {
          teacher: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { assignments: true },
          },
        },
        orderBy: { code: 'asc' },
      });
    } else {
      // ADMIN: all courses
      courses = await prisma.course.findMany({
        include: {
          teacher: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { enrollments: true, assignments: true },
          },
        },
        orderBy: { code: 'asc' },
      });
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error: any) {
    console.error('[Get Courses Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve courses.',
    });
  }
}

/**
 * GET /api/v1/courses/:courseId
 * Retrieve detailed course information including assignments and enrollment list
 */
export async function getCourseById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const courseId = req.params.courseId as string;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          select: { id: true, name: true, email: true, department: true },
        },
        assignments: {
          orderBy: { dueDate: 'asc' },
          include: {
            _count: { select: { submissions: true } },
          },
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({
        error: 'NotFound',
        message: `Course with ID '${courseId}' not found.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    console.error('[Get Course By ID Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve course details.',
    });
  }
}

/**
 * POST /api/v1/courses
 * Create a new academic course (Instructor or Admin only)
 */
export async function createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createCourseSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid course input',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { code, name, semester, department } = parseResult.data;

    // Check for duplicate course code
    const existingCourse = await prisma.course.findUnique({
      where: { code },
    });

    if (existingCourse) {
      res.status(409).json({
        error: 'Conflict',
        message: `Course with code '${code}' already exists.`,
      });
      return;
    }

    const newCourse = await prisma.course.create({
      data: {
        code,
        name,
        semester,
        department,
        teacherId: req.user!.id,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Course '${newCourse.code}: ${newCourse.name}' created successfully.`,
      course: newCourse,
    });
  } catch (error: any) {
    console.error('[Create Course Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to create course.',
    });
  }
}

/**
 * DELETE /api/v1/courses/:courseId
 * Delete a course and all cascade dependencies (Teacher who owns it, or Admin)
 */
export async function deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const courseId = req.params.courseId as string;
    const user = req.user!;

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

    // Only the course's teacher or an Admin can delete it
    if (user.role !== 'ADMIN' && course.teacherId !== user.id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete courses that you teach.',
      });
      return;
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    res.status(200).json({
      success: true,
      message: `Course '${course.code}' and all related records deleted successfully.`,
    });
  } catch (error: any) {
    console.error('[Delete Course Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to delete course.',
    });
  }
}
