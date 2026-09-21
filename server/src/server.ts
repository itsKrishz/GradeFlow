import dotenv from 'dotenv';
// Load environment variables before anything else
dotenv.config();

import app from './app';

const PORT = Number(process.env.PORT) || 5001;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 GradeFlow Server running in [${process.env.NODE_ENV || 'development'}] mode`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health Probe: http://localhost:${PORT}/health`);
  console.log(`📚 API Gateway: http://localhost:${PORT}/api/v1`);
  console.log('====================================================');
});

// Graceful shutdown handlers
const handleShutdown = (signal: string) => {
  console.log(`\n[${signal}] signal received: Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
