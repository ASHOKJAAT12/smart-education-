const { getConnectionState } = require('../config/db');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/v1/health
 * Returns basic health status of the API and its dependencies.
 */
const getHealth = asyncHandler(async (req, res) => {
    const dbState = getConnectionState();

    successResponse(
        res,
        {
            status: 'ok',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            database: {
                status: dbState,
                connected: dbState === 'connected',
            },
        },
        'SmartLearn AI API is running'
    );
});

module.exports = { getHealth };
