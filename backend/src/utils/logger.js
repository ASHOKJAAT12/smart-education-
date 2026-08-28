/**
 * Structured logger for SmartLearn AI.
 *
 * - JSON lines in production (machine-parseable by hosting providers)
 * - Human-readable, coloured-ish output in development
 * - Automatic redaction of secret-looking keys so tokens/keys never reach logs
 *
 * Intentionally dependency-free: adding winston/pino would be extra weight for
 * a project that only needs stdout/stderr structured logs.
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const CURRENT_LEVEL =
    LEVELS[(process.env.LOG_LEVEL || '').toLowerCase()] ??
    (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);

const IS_PROD = process.env.NODE_ENV === 'production';

/** Keys whose values must never be logged. */
const REDACT_KEYS = [
    'password',
    'passwordhash',
    'newpassword',
    'currentpassword',
    'token',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'cookie',
    'jwt_access_secret',
    'jwt_refresh_secret',
    'apikey',
    'api_key',
    'ai_api_key',
    'gemini_api_key',
    'openai_api_key',
    'cloudinary_api_secret',
    'brevo_smtp_pass',
    'mongodb_uri',
    'secret',
];

const REDACTED = '[REDACTED]';

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Recursively redact secret-looking fields. Depth-limited to avoid pathological
 * payloads and circular structures.
 */
const redact = (value, depth = 0) => {
    if (depth > 4) return '[TRUNCATED]';
    if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
    if (!isPlainObject(value)) return value;

    const out = {};
    for (const [key, val] of Object.entries(value)) {
        if (REDACT_KEYS.includes(key.toLowerCase())) {
            out[key] = REDACTED;
        } else if (isPlainObject(val) || Array.isArray(val)) {
            out[key] = redact(val, depth + 1);
        } else {
            out[key] = val;
        }
    }
    return out;
};

const write = (level, message, meta = {}) => {
    if (LEVELS[level] > CURRENT_LEVEL) return;

    const safeMeta = redact(meta);
    const stream = level === 'error' ? process.stderr : process.stdout;

    if (IS_PROD) {
        stream.write(
            `${JSON.stringify({
                ts: new Date().toISOString(),
                level,
                msg: message,
                ...safeMeta,
            })}\n`
        );
        return;
    }

    const metaStr = Object.keys(safeMeta).length ? ` ${JSON.stringify(safeMeta)}` : '';
    stream.write(`[${level.toUpperCase()}] ${message}${metaStr}\n`);
};

const logger = {
    error: (message, meta) => write('error', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    info: (message, meta) => write('info', message, meta),
    debug: (message, meta) => write('debug', message, meta),

    /** Domain-specific helpers keep event names consistent for later querying. */
    authFailure: (reason, meta) => write('warn', 'auth.failure', { reason, ...meta }),
    aiFailure: (operation, meta) => write('error', 'ai.failure', { operation, ...meta }),
    dbFailure: (operation, meta) => write('error', 'db.failure', { operation, ...meta }),
    uploadFailure: (meta) => write('warn', 'upload.failure', meta),
    emailFailure: (meta) => write('warn', 'email.failure', meta),
    adminAction: (action, meta) => write('info', 'admin.action', { action, ...meta }),
};

module.exports = logger;
