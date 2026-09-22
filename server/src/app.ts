import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS)
// Allows frontend running on port 3000 / 3001 to communicate with this server
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

import path from 'path';

// 3. Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Statically serve uploaded submission files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 5. Request Logging in Development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

import prisma from './lib/prisma';

// 5. System & Database Health Check Endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    res.status(200).json({
      status: 'ok',
      service: 'GradeFlow API Gateway',
      database: {
        status: 'connected',
        latencyMs: dbLatencyMs,
        provider: 'postgresql'
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'degraded',
      service: 'GradeFlow API Gateway',
      database: {
        status: 'disconnected',
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// 6. Base API v1 Welcome Route
app.get('/api/v1', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'GradeFlow Academic Evaluation API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      courses: '/api/v1/courses',
      assignments: '/api/v1/assignments',
      submissions: '/api/v1/submissions',
      evaluations: '/api/v1/evaluations'
    }
  });
});

import authRoutes from './routes/auth.routes';
import coursesRoutes from './routes/courses.routes';
import assignmentsRoutes from './routes/assignments.routes';
import submissionsRoutes from './routes/submissions.routes';
import evaluationsRoutes from './routes/evaluations.routes';

// 7. Route Modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', coursesRoutes);
app.use('/api/v1/assignments', assignmentsRoutes);
app.use('/api/v1/submissions', submissionsRoutes);
app.use('/api/v1/evaluations', evaluationsRoutes);

// 8. 404 Catch-All Handler (for routes that do not exist)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found on GradeFlow server.`
  });
});

// 8. Global Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
