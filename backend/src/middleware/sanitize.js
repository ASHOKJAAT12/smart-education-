const logger = require('../utils/logger');

/**
 * NoSQL-injection sanitizer.
 *
 * Mongo query operators are expressed as object keys beginning with `$`
 * (e.g. `{ "$gt": "" }`), and dotted keys can reach into nested paths
 * (e.g. `{ "user.role": "admin" }`). If such a payload reaches a query filter
 * it can bypass equality checks — the classic `{"email":{"$gt":""}}` login
 * bypass.
 *
 * This middleware strips those keys from body / query / params before any
 * controller runs. Values are left untouched, so ordinary text containing `$`
 * or `.` (prices, filenames, emails) is unaffected — only *keys* are filtered.
 *
 * Implemented in-house rather than adding express-mongo-sanitize: the logic is
 * ~30 lines and that package is incompatible with newer Express request objects.
 */

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const MAX_DEPTH = 8;

/**
 * Recursively delete dangerous keys, mutating in place.
 * @returns {number} number of keys removed
 */
const scrub = (value, depth = 0) => {
    if (depth > MAX_DEPTH) return 0;

    let removed = 0;

    if (Array.isArray(value)) {
        for (const item of value) removed += scrub(item, depth + 1);
        return removed;
    }

    if (!isPlainObject(value)) return 0;

    for (const key of Object.keys(value)) {
        if (key.startsWith('$') || key.includes('.')) {
            delete value[key];
            removed += 1;
            continue;
        }
        // Block prototype-pollution vectors too.
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            delete value[key];
            removed += 1;
            continue;
        }
        removed += scrub(value[key], depth + 1);
    }

    return removed;
};

const sanitizeRequest = (req, res, next) => {
    let removed = 0;

    // Mutate in place rather than reassigning: req.query is a getter in Express.
    if (req.body) removed += scrub(req.body);
    if (req.query) removed += scrub(req.query);
    if (req.params) removed += scrub(req.params);

    if (removed > 0) {
        logger.warn('security.sanitized_request', {
            method: req.method,
            path: req.originalUrl,
            keysRemoved: removed,
        });
    }

    return next();
};

module.exports = sanitizeRequest;
