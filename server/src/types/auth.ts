import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  username: string | null;
  email: string;
  name: string;
  role: Role;
  department: string | null;
}

export interface JwtTokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
