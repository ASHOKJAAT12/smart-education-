const logger = require('../utils/logger');

/**
 * Startup environment validation.
 *
 * Fails fast on missing required configuration so the server never boots into a
 * half-configured state, and refuses to start in production with weak or
 * placeholder secrets.
 *
 * Optional integrations (AI, Cloudinary, email) are reported as degraded
 * capabilities rather than fatal errors — the core learning platform must still
 * run without them.
 */

const REQUIRED = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL'];

const MIN_SECRET_LENGTH = 32;

/** Obvious placeholders that must never reach production. */
const WEAK_SECRET_PATTERNS = [
    /^changeme/i,
    /^secret$/i,
    /^your[-_ ]?secret/i,
    /^replace[-_ ]?me/i,
    /^test/i,
    /^dev$/i,
];

/**
 * Optional feature groups: all-or-nothing within each group.
 *
 * Key names must match exactly what the services actually read — see
 * `services/emailService.js`, `services/cloudinaryService.js` and
 * `services/ai/ai.provider.js`. A mismatch here reports a working integration
 * as disabled.
 */
const OPTIONAL_GROUPS = {
    ai: ['AI_API_KEY'],
    cloudinary: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    // emailService falls back to a default host/port and sender, so only the
    // credentials genuinely gate whether mail can be sent.
    email: ['BREVO_SMTP_USER', 'BREVO_SMTP_PASS'],
};

const isWeak = (value) =>
    value.length < MIN_SECRET_LENGTH || WEAK_SECRET_PATTERNS.some((p) => p.test(value));

/**
 * @returns {{ features: Record<string, boolean> }}
 * @throws {Error} when configuration is unusable
 */
const validateEnv = () => {
    const isProd = process.env.NODE_ENV === 'production';

    const missing = REQUIRED.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        // Names only — never log the values.
        logger.error('env.missing_required', { missing });
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // ── Secret strength ────────────────────────────────────────────────────
    const weakSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((key) =>
        isWeak(process.env[key])
    );

    if (weakSecrets.length > 0) {
        if (isProd) {
            logger.error('env.weak_secrets', { keys: weakSecrets });
            throw new Error(
                `Refusing to start in production with weak secrets: ${weakSecrets.join(', ')}. ` +
                    `Use random values of at least ${MIN_SECRET_LENGTH} characters.`
            );
        }
        logger.warn('env.weak_secrets_dev', {
            keys: weakSecrets,
            hint: `Use at least ${MIN_SECRET_LENGTH} random characters before deploying.`,
        });
    }

    // Reusing one secret for both tokens removes the benefit of having two.
    if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
        const message = 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.';
        if (isProd) throw new Error(message);
        logger.warn('env.duplicate_jwt_secrets', { hint: message });
    }

    // ── Optional feature detection ─────────────────────────────────────────
    const features = {};
    for (const [name, keys] of Object.entries(OPTIONAL_GROUPS)) {
        const present = keys.filter((k) => process.env[k]);
        features[name] = present.length === keys.length;

        if (present.length > 0 && present.length < keys.length) {
            logger.warn('env.partial_feature_config', {
                feature: name,
                missing: keys.filter((k) => !process.env[k]),
                effect: `${name} will be disabled until all values are set.`,
            });
        } else if (present.length === 0) {
            logger.info('env.feature_disabled', {
                feature: name,
                effect: 'Related functionality will degrade gracefully.',
            });
        }
    }

    logger.info('env.validated', { environment: process.env.NODE_ENV || 'development', features });

    return { features };
};

module.exports = { validateEnv, REQUIRED, OPTIONAL_GROUPS };
