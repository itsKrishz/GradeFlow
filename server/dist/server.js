"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before anything else
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const PORT = Number(process.env.PORT) || 5001;
const server = app_1.default.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 GradeFlow Server running in [${process.env.NODE_ENV || 'development'}] mode`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health Probe: http://localhost:${PORT}/health`);
    console.log(`📚 API Gateway: http://localhost:${PORT}/api/v1`);
    console.log('====================================================');
});
// Graceful shutdown handlers
const handleShutdown = (signal) => {
    console.log(`\n[${signal}] signal received: Closing HTTP server gracefully...`);
    server.close(() => {
        console.log('HTTP server closed. Exiting process.');
        process.exit(0);
    });
};
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
