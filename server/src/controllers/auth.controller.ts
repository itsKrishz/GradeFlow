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

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Valid institutional email is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['TEACHER', 'STUDENT', 'ADMIN', 'teacher', 'student', 'admin']).default('STUDENT'),
  department: z.string().optional().default('Computer Science'),
});

/**
 * POST /api/v1/auth/users
 * Admin endpoint to register new faculty evaluators and student accounts
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid user creation payload',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, username, email, password, role, department } = parseResult.data;
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check for existing username or email collision
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail },
        ],
      },
    });

    if (existing) {
      res.status(409).json({
        error: 'Conflict',
        message: `Account with username '${cleanUsername}' or email '${cleanEmail}' already exists.`,
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedRole = role.toUpperCase() as any;

    const newUser = await prisma.user.create({
      data: {
        name,
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: normalizedRole,
        department,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `Academic account for ${name} (${normalizedRole}) created successfully.`,
      user: newUser,
    });
  } catch (error: any) {
    console.error('[Auth Create User Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to create user account.',
    });
  }
}

/**
 * GET /api/v1/auth/users
 * Returns list of registered users for Admin User Management
 */
export async function getAllUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    console.error('[Auth Get Users Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to retrieve academic users.',
    });
  }
}

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  username: z.string().min(2, 'Username must be at least 2 characters').optional(),
  email: z.string().email('Valid institutional email is required').optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  role: z.enum(['TEACHER', 'STUDENT', 'ADMIN', 'teacher', 'student', 'admin']).optional(),
  department: z.string().optional(),
});

/**
 * PUT /api/v1/auth/users/:id
 * Admin endpoint to update an existing user's details or credentials
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid update payload',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({
        error: 'NotFound',
        message: `User with id '${id}' was not found.`,
      });
      return;
    }

    const { name, username, email, password, role, department } = parseResult.data;
    const cleanUsername = username ? username.trim().toLowerCase() : undefined;
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    // Check collision if username or email is changing
    if (cleanUsername && cleanUsername !== existingUser.username) {
      const conflict = await prisma.user.findFirst({
        where: { username: cleanUsername, NOT: { id } },
      });
      if (conflict) {
        res.status(409).json({
          error: 'Conflict',
          message: `Username '@${cleanUsername}' is already taken.`,
        });
        return;
      }
    }

    if (cleanEmail && cleanEmail !== existingUser.email) {
      const conflict = await prisma.user.findFirst({
        where: { email: cleanEmail, NOT: { id } },
      });
      if (conflict) {
        res.status(409).json({
          error: 'Conflict',
          message: `Email '${cleanEmail}' is already registered.`,
        });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (cleanUsername) updateData.username = cleanUsername;
    if (cleanEmail) updateData.email = cleanEmail;
    if (department !== undefined) updateData.department = department;
    if (role) updateData.role = role.toUpperCase();
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        department: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User '${updatedUser.name}' updated successfully.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('[Auth Update User Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to update user account.',
    });
  }
}

/**
 * DELETE /api/v1/auth/users/:id
 * Admin endpoint to delete a user account
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        error: 'NotFound',
        message: `User with id '${id}' was not found.`,
      });
      return;
    }

    // Clean up dependent child records before deletion
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.courseEnrollment.deleteMany({ where: { studentId: id } });
    await prisma.evaluation.deleteMany({ where: { evaluatorId: id } });
    await prisma.submission.deleteMany({ where: { studentId: id } });
    await prisma.course.deleteMany({ where: { teacherId: id } });

    await prisma.user.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: `User '${existing.name}' was permanently deleted.`,
    });
  } catch (error: any) {
    console.error('[Auth Delete User Error]:', error);
    res.status(500).json({
      error: 'ServerError',
      message: 'Failed to delete user account.',
    });
  }
}

