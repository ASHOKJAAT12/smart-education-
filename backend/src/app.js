const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow same-machine tools (curl, Postman) with no origin
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─── Request Logging ───────────────────────────────────────────────────────
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── General Rate Limiter ──────────────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 100,              // 100 requests per IP per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please slow down.' },
});
app.use('/api', generalLimiter);

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler (must be last) ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
