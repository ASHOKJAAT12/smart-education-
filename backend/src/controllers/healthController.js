const { getConnectionState } = require('../config/db');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Health endpoints.
 *
 * Deliberately minimal: no version numbers of dependencies, no hostnames, no
 * connection strings. Infrastructure needs to know "is this process alive" and
 * "can it serve traffic" — nothing more.
 */

/**
 * GET /api/v1/health — liveness.
 * Always 200 while the process is running. Used by platform restart policies,
 * so it must NOT depend on the database: a transient DB outage should not cause
 * the container to be killed and restarted in a loop.
 */
const getHealth = asyncHandler(async (req, res) =>
    successResponse(
        res,
        {
            status: 'ok',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            database: {
                status: getConnectionState(),
                connected: getConnectionState() === 'connected',
            },
        },
        'SmartLearn AI API is running'
    )
);

/**
 * GET /api/v1/health/ready — readiness.
 * 200 only when the API can actually serve requests (database reachable).
 * Returns 503 otherwise so load balancers stop routing traffic here.
 */
const getReadiness = asyncHandler(async (req, res) => {
    const dbState = getConnectionState();
    const ready = dbState === 'connected';

    return res.status(ready ? 200 : 503).json({
        success: ready,
        message: ready ? 'Ready to serve traffic' : 'Not ready: database unavailable',
        data: {
            ready,
            // State name only — never the URI or host.
            database: dbState,
            timestamp: new Date().toISOString(),
        },
    });
});

module.exports = { getHealth, getReadiness };
