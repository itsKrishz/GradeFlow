import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  deleteAssignment,
} from '../controllers/assignments.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All assignment routes require authentication
router.use(authenticate);

// List assignments (optionally ?courseId=...)
router.get('/', getAssignments);

// Get specific assignment details with rubrics
router.get('/:assignmentId', getAssignmentById);

// Create assignment with rubrics (Instructor/Admin only)
router.post('/', requireRole(Role.TEACHER, Role.ADMIN), createAssignment);

// Delete assignment (Instructor/Admin only)
router.delete('/:assignmentId', requireRole(Role.TEACHER, Role.ADMIN), deleteAssignment);

export default router;
