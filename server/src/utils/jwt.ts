import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtTokenPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'gradeflow_super_secure_academic_dev_secret_2026';

/**
 * Generate a signed JWT token containing essential user claims
 */
export function signToken(payload: JwtTokenPayload): string {
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode an incoming JWT token
 */
export function verifyToken(token: string): JwtTokenPayload {
  return jwt.verify(token, JWT_SECRET) as JwtTokenPayload;
}
