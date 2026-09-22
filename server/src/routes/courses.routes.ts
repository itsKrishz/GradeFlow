import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getCourses,
  getCourseById,
  createCourse,
  deleteCourse,
} from '../controllers/courses.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All course routes require authentication
router.use(authenticate);

// List courses (scoped by role: enrolled courses for students, taught for instructors)
router.get('/', getCourses);

// Get specific course details
router.get('/:courseId', getCourseById);

// Create course (Instructor or Admin only)
router.post('/', requireRole(Role.TEACHER, Role.ADMIN), createCourse);

// Delete course (Instructor or Admin only)
router.delete('/:courseId', requireRole(Role.TEACHER, Role.ADMIN), deleteCourse);

export default router;
