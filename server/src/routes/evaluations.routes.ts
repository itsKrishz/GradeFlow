import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getEvaluations,
  getEvaluationBySubmissionId,
  saveEvaluation,
  updateSimilarityReport,
} from '../controllers/evaluations.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All evaluation routes require authentication
router.use(authenticate);

// List evaluations (Scoped by role: instructors see course submissions, students see their own)
router.get('/', getEvaluations);

// Get specific evaluation and similarity report by submissionId
router.get('/submission/:submissionId', getEvaluationBySubmissionId);

// Save or publish evaluation with rubric breakdown (Instructors/Admins only)
router.post('/', requireRole(Role.TEACHER, Role.ADMIN), saveEvaluation);

// Update similarity report and integrity flag status (Instructors/Admins only)
router.put('/similarity/:submissionId', requireRole(Role.TEACHER, Role.ADMIN), updateSimilarityReport);

export default router;
