import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest, AuthUser } from '../types/auth';
import { verifyToken } from '../utils/jwt';
import prisma from '../lib/prisma';

/**
 * Middleware to authenticate requests using JWT Bearer tokens
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required. Provide header Authorization: Bearer <token>',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Malformed authorization token.',
      });
      return;
    }

    const decoded = verifyToken(token);

    // Verify that the user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        department: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User belonging to this token no longer exists.',
      });
      return;
    }

    req.user = user as AuthUser;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'TokenExpired',
        message: 'Session has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      error: 'InvalidToken',
      message: 'Invalid or malformed authentication token.',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware generator
 * Example usage: router.post('/create', authenticate, requireRole(Role.TEACHER, Role.ADMIN), handler)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: [${req.user.role}].`,
      });
      return;
    }

    next();
  };
}
