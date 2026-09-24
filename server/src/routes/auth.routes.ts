import { Router } from 'express';
import { Role } from '@prisma/client';
import { login, getCurrentUser, createUser, getAllUsers, updateUser, deleteUser } from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public Authentication Route
router.post('/login', login);

// User Management (Admin provisioning & account editing/deletion)
router.post('/users', createUser);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Protected Identity Route
router.get('/me', authenticate, getCurrentUser);

// Role Verification Test Routes (Useful for testing RBAC)
router.get('/test-teacher', authenticate, requireRole(Role.TEACHER, Role.ADMIN), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Access granted to Teacher/Admin portal endpoint.',
  });
});

router.get('/test-student', authenticate, requireRole(Role.STUDENT), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Access granted to Student portal endpoint.',
  });
});

export default router;
