"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
// 1. Security HTTP Headers
app.use((0, helmet_1.default)());
// 2. Cross-Origin Resource Sharing (CORS)
// Allows frontend running on port 3000 / 3001 to communicate with this server
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS blocked request from origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// 3. Request Body Parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 4. Request Logging in Development
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
// 5. System Health Check Endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'GradeFlow API Gateway',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// 6. Base API v1 Welcome Route
app.get('/api/v1', (_req, res) => {
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
// 7. 404 Catch-All Handler (for routes that do not exist)
app.use((req, res) => {
    res.status(404).json({
        error: 'NotFound',
        message: `Cannot ${req.method} ${req.originalUrl} - Route not found on GradeFlow server.`
    });
});
// 8. Global Centralized Error Handling Middleware
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Server Error]:', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred on the server.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
exports.default = app;
