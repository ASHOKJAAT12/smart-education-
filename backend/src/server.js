require('dotenv').config();

const { validateEnv } = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');

/**
 * SmartLearn AI — Backend Server Entry Point
 *
 * Startup sequence:
 * 1. Load environment variables
 * 2. Validate required env vars
 * 3. Connect to MongoDB
 * 4. Start HTTP server
 */
const startServer = async () => {
    // Validate environment variables before anything else
    try {
        validateEnv();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }

    // Connect to MongoDB (non-blocking — server starts regardless)
    await connectDB();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(`🚀 SmartLearn API running on port ${PORT}`);
        console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Health check: http://localhost:${PORT}/api/v1/health`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
        console.log(`\n⚡ ${signal} received — shutting down gracefully`);
        server.close(() => {
            console.log('✅ HTTP server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
        console.error('⚠️  Unhandled Rejection:', reason);
        // Don't crash in development — useful for debugging
        if (process.env.NODE_ENV === 'production') {
            shutdown('unhandledRejection');
        }
    });
};

startServer();
