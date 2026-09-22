import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
} from '../controllers/submissions.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All submission routes require authentication
router.use(authenticate);

// Submit an assignment (Students only)
router.post('/', requireRole(Role.STUDENT), createSubmission);

// List submissions (Scoped by role: instructors see course submissions, students see their own)
router.get('/', getSubmissions);

// View specific submission details
router.get('/:submissionId', getSubmissionById);

export default router;
