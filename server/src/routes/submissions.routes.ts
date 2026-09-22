import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionStatus,
} from '../controllers/submissions.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadSubmissionFile } from '../middleware/upload';

const router = Router();

// All submission routes require authentication
router.use(authenticate);

// Submit an assignment (Students only - supports both JSON and multipart form upload)
router.post('/', requireRole(Role.STUDENT), uploadSubmissionFile.single('file'), createSubmission);

// List submissions (Scoped by role: instructors see course submissions, students see their own)
router.get('/', getSubmissions);

// Real-time status polling for background processing pipeline
router.get('/:submissionId/status', getSubmissionStatus);

// View specific submission details
router.get('/:submissionId', getSubmissionById);

export default router;
