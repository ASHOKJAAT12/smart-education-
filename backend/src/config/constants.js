/**
 * SmartLearn AI — Centralized domain constants.
 *
 * Phase 11 hardening: every service that reasons about mastery, recommendations,
 * analytics or AI limits MUST import from here. Previously each phase re-declared
 * its own thresholds (e.g. 50/80 in one service, 40/60/80 in another) which made
 * "Mastered" mean different things on the student dashboard and teacher analytics.
 */

// ─── Mastery ────────────────────────────────────────────────────────────────
/**
 * Canonical mastery bands. A score is classified by the highest band whose
 * `min` it satisfies. These values are the single source of truth platform-wide.
 */
const MASTERY_THRESHOLDS = {
    MASTERED: 80,
    GOOD: 60,
    NEEDS_IMPROVEMENT: 40,
    // anything below NEEDS_IMPROVEMENT is 'weak'
};

const MASTERY_LEVELS = {
    WEAK: 'weak',
    NEEDS_IMPROVEMENT: 'needs_improvement',
    GOOD: 'good',
    MASTERED: 'mastered',
};

const PROGRESS_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    NEEDS_IMPROVEMENT: 'needs_improvement',
    MASTERED: 'mastered',
};

/**
 * Weighting used when blending a new activity score into historical mastery.
 * Recency is weighted higher so the system adapts, but history prevents a single
 * unlucky attempt from destroying an established standing.
 */
const MASTERY_WEIGHTS = {
    RECENT: 0.6,
    HISTORICAL: 0.4,
};

/** A topic counts as "completed / covered" for analytics at this mastery. */
const TOPIC_COMPLETION_MASTERY = MASTERY_THRESHOLDS.GOOD;

/** Adaptive practice difficulty selection bands (based on current mastery). */
const PRACTICE_DIFFICULTY_BANDS = {
    HARD_FROM: 70,
    MEDIUM_FROM: 40,
};

const PRACTICE_SESSION_SIZE = 10;

// ─── Recommendations ────────────────────────────────────────────────────────
const RECOMMENDATION_LIMITS = {
    MAX_ACTIVE: 5,
    STRUGGLE_ATTEMPT_THRESHOLD: 3,
    DECLINE_DELTA: 10,
    DECLINE_BONUS: 15,
    STRUGGLE_BONUS: 25,
    MASTERED_PENALTY: 50,
};

const RECOMMENDATION_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    DISCARDED: 'discarded',
};

// ─── Analytics definitions ──────────────────────────────────────────────────
/**
 * Documented metric definitions shared by teacher and admin analytics so both
 * dashboards report the same numbers. See docs/architecture.md.
 */
const ANALYTICS = {
    /** A student is "active" if they logged activity within this many days. */
    ACTIVE_STUDENT_DAYS: 7,
    /** Average mastery = mean of Progress.masteryScore across matched documents. */
    /** Quiz accuracy = correctCount / (correctCount + incorrectCount + unansweredCount). */
    DEFAULT_TREND_DAYS: 30,
};

// ─── Pagination ─────────────────────────────────────────────────────────────
const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};

// ─── AI limits ──────────────────────────────────────────────────────────────
const AI_LIMITS = {
    MAX_MESSAGE_CHARS: 2000,
    MAX_CONCEPT_CHARS: 200,
    MAX_HISTORY_MESSAGES: 10,
    MAX_MESSAGES_PER_CONVERSATION: 200,
    MIN_QUESTION_COUNT: 1,
    MAX_QUESTION_COUNT: 10,
    MAX_GENERATED_QUESTION_CHARS: 1000,
    MAX_GENERATED_EXPLANATION_CHARS: 2000,
    REQUIRED_OPTION_COUNT: 4,
};

// ─── Uploads ────────────────────────────────────────────────────────────────
const UPLOAD_LIMITS = {
    MAX_IMAGE_MB: 5,
    MAX_FILE_MB: 25,
};

// ─── Error codes (stable, safe to expose to clients) ───────────────────────
const ERROR_CODES = {
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    RATE_LIMITED: 'RATE_LIMITED',
    AI_UNAVAILABLE: 'AI_UNAVAILABLE',
    AI_NOT_CONFIGURED: 'AI_NOT_CONFIGURED',
    UPLOAD_REJECTED: 'UPLOAD_REJECTED',
    EMAIL_FAILED: 'EMAIL_FAILED',
    INTERNAL: 'INTERNAL_ERROR',
};

const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
};

module.exports = {
    MASTERY_THRESHOLDS,
    MASTERY_LEVELS,
    PROGRESS_STATUS,
    MASTERY_WEIGHTS,
    TOPIC_COMPLETION_MASTERY,
    PRACTICE_DIFFICULTY_BANDS,
    PRACTICE_SESSION_SIZE,
    RECOMMENDATION_LIMITS,
    RECOMMENDATION_STATUS,
    ANALYTICS,
    PAGINATION,
    AI_LIMITS,
    UPLOAD_LIMITS,
    ERROR_CODES,
    ROLES,
};
