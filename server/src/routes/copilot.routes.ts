import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  handleCopilotQuery,
  handleDraftAssignment,
} from '../controllers/copilot.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All copilot routes require teacher or admin privileges
router.use(authenticate);
router.use(requireRole(Role.TEACHER, Role.ADMIN));

// Natural language database queries and analytical synthesis
router.post('/query', handleCopilotQuery);

// AI assignment and rubric draft generator
router.post('/draft-assignment', handleDraftAssignment);

export default router;
