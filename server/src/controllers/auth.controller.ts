import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { signToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types/auth';

// Validation schema for login request body
const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => data.username || data.email || data.identifier, {
  message: 'Username or email is required',
  path: ['identifier'],
});

/**
 * POST /api/v1/auth/login
 * Authenticates Teacher, Student, or Admin and returns signed JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid input data',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, email, identifier: rawIdentifier, password } = parseResult.data;
    const identifier = (rawIdentifier || username || email || '').trim().toLowerCase();

    // Look up user by either username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user) {
      res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid username/email or password.',
      });
      return;
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid username/email or password.',
      });
      return;
    }

    // Issue JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'An error occurred while processing login.',
    });
  }
}

/**
 * GET /api/v1/auth/me
 * Returns profile details for the currently authenticated user
 */
export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Not authenticated',
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: req.user,
  });
}
