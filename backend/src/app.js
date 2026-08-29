const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const routes = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const sanitizeRequest = require('./middleware/sanitize');
const { generalLimiter } = require('./middleware/rateLimiters');
const logger = require('./utils/logger');

const app = express();

const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Proxy trust ───────────────────────────────────────────────────────────
// Render/Railway/Heroku terminate TLS at a proxy. Without this, req.ip is the
// proxy address and every user shares one rate-limit bucket. Trust exactly one
// hop rather than `true`, which would let clients spoof X-Forwarded-For.
if (IS_PROD) app.set('trust proxy', 1);

// Do not advertise the framework.
app.disable('x-powered-by');

// ─── Security headers ──────────────────────────────────────────────────────
app.use(
    helmet({
        // This is a JSON API; a restrictive CSP here does not protect the SPA
        // (served separately) and can break API docs tooling.
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        // Allow the separately-hosted frontend to read API responses.
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        referrerPolicy: { policy: 'no-referrer' },
        frameguard: { action: 'deny' },
        // HSTS only makes sense over HTTPS in production.
        hsts: IS_PROD ? { maxAge: 15552000, includeSubDomains: true } : false,
    })
);

// ─── CORS ──────────────────────────────────────────────────────────────────
/**
 * Allowed origins come from CLIENT_URL (comma-separated). In development we
 * additionally allow the standard Vite ports so a fresh clone works with no
 * configuration. Production allows ONLY what is configured — never '*', since
 * these endpoints are authenticated.
 */
const configuredOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'];

const allowedOrigins = IS_PROD
    ? configuredOrigins
    : [...new Set([...configuredOrigins, ...devOrigins])];

if (IS_PROD && allowedOrigins.length === 0) {
    logger.warn('cors.no_origins_configured', {
        hint: 'Set CLIENT_URL to your frontend domain; browser requests will otherwise be blocked.',
    });
}

app.use(
    cors({
        origin: (origin, callback) => {
            // Server-to-server tools (curl, health checks) send no Origin header.
            // They are not subject to the browser same-origin policy, so allowing
            // them does not weaken CORS.
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);

            logger.warn('cors.origin_rejected', { origin });
            // Reject by omitting CORS headers rather than throwing a 500.
            return callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400, // cache preflight for a day
    })
);

// ─── Request logging ───────────────────────────────────────────────────────
if (IS_PROD) {
    // Route through the structured logger and skip health checks, which would
    // otherwise dominate production logs.
    app.use(
        morgan('combined', {
            skip: (req) => req.originalUrl.startsWith('/api/v1/health'),
            stream: { write: (line) => logger.info('http.access', { line: line.trim() }) },
        })
    );
} else {
    app.use(morgan('dev'));
}

// ─── Body parsing ──────────────────────────────────────────────────────────
// 1mb is ample for JSON payloads (quiz answers, AI prompts). File uploads go
// through multer, which enforces its own limits. The previous 10mb ceiling made
// memory-exhaustion attacks cheap.
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── NoSQL injection / prototype-pollution sanitization ────────────────────
app.use(sanitizeRequest);

// ─── Baseline rate limiting (route-specific limiters add stricter caps) ────
app.use('/api', generalLimiter);

// ─── API routes ────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 ───────────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
