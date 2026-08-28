const { AI_LIMITS } = require('../config/constants');

/**
 * AI guard rails.
 *
 * The AI is treated as an untrusted, best-effort text generator. It is never
 * allowed to decide authorization, scores, mastery or publication state — those
 * remain deterministic backend concerns. This module handles the two boundaries:
 *
 *   1. INPUT  — neutralise prompt-injection attempts before they reach the model
 *   2. OUTPUT — validate/repair generated questions before they touch the DB
 */

// ─── Input hardening ───────────────────────────────────────────────────────

/**
 * Phrases commonly used to hijack a system prompt. We neutralise rather than
 * reject: a student legitimately asking "ignore the previous step" in a maths
 * question should not be blocked, but the model should not read it as an
 * instruction either.
 */
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+|any\s+)?(previous|prior|above)\s+instructions?/gi,
    /disregard\s+(all\s+|any\s+)?(previous|prior|above)/gi,
    /forget\s+(everything|all\s+previous|your\s+instructions)/gi,
    /you\s+are\s+now\s+(a|an)\s+/gi,
    /new\s+(system\s+)?(prompt|instructions?)\s*:/gi,
    /system\s*prompt\s*:/gi,
    /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?)/gi,
    /act\s+as\s+(a\s+)?(developer|admin|administrator|root)/gi,
    /\bDAN\s+mode\b/gi,
    /<\|.*?\|>/g, // chat-template control tokens
];

const REDACTION = '[filtered]';

/**
 * Sanitize free-text user input destined for a model prompt.
 *
 * @param {string} input
 * @param {number} maxLength
 * @returns {{ text: string, wasFiltered: boolean }}
 */
const sanitizePrompt = (input, maxLength = AI_LIMITS.MAX_MESSAGE_CHARS) => {
    let text = String(input ?? '');

    // Strip control characters that can be used to smuggle template tokens.
    // eslint-disable-next-line no-control-regex
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

    let wasFiltered = false;
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(text)) {
            wasFiltered = true;
            text = text.replace(pattern, REDACTION);
        }
        pattern.lastIndex = 0; // reset stateful global regexes
    }

    text = text.trim().slice(0, maxLength);
    return { text, wasFiltered };
};

// ─── Output validation ────────────────────────────────────────────────────

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Validate and normalise a single AI-generated MCQ.
 *
 * Rejects (rather than silently repairs) anything structurally unusable, so a
 * hallucinated question never becomes a real question a student is graded on.
 * The only repair performed is de-duplicating options, which is safe.
 *
 * @param {object} raw candidate question from the model
 * @param {object} context { subjectId, topicId, createdBy, fallbackDifficulty }
 * @returns {{ ok: true, question: object } | { ok: false, reason: string }}
 */
const validateGeneratedQuestion = (raw, context) => {
    if (!raw || typeof raw !== 'object') return { ok: false, reason: 'not_an_object' };

    if (!isNonEmptyString(raw.question)) return { ok: false, reason: 'missing_question_text' };
    if (raw.question.length > AI_LIMITS.MAX_GENERATED_QUESTION_CHARS) {
        return { ok: false, reason: 'question_too_long' };
    }

    if (!Array.isArray(raw.options)) return { ok: false, reason: 'options_not_array' };

    // Keep order, drop blanks and duplicates.
    const options = [];
    for (const opt of raw.options) {
        if (!isNonEmptyString(opt)) continue;
        const value = opt.trim();
        if (!options.includes(value)) options.push(value);
    }

    if (options.length !== AI_LIMITS.REQUIRED_OPTION_COUNT) {
        // Previously the code padded with "<answer> (Alternative Variant)",
        // which produced obviously-fake distractors and gave away the answer.
        return { ok: false, reason: 'wrong_option_count' };
    }

    // correctAnswer may arrive as text or as an index depending on the model.
    let correctIndex = -1;
    if (Number.isInteger(raw.correctAnswer)) {
        correctIndex = raw.correctAnswer;
    } else if (isNonEmptyString(raw.correctAnswer)) {
        correctIndex = options.indexOf(raw.correctAnswer.trim());
    }

    if (correctIndex < 0 || correctIndex >= options.length) {
        return { ok: false, reason: 'correct_answer_not_in_options' };
    }

    const explanation = isNonEmptyString(raw.explanation)
        ? raw.explanation.trim().slice(0, AI_LIMITS.MAX_GENERATED_EXPLANATION_CHARS)
        : '';

    const difficulty = ['easy', 'medium', 'hard'].includes(raw.difficulty)
        ? raw.difficulty
        : context.fallbackDifficulty || 'medium';

    return {
        ok: true,
        question: {
            subjectId: context.subjectId,
            topicId: context.topicId,
            question: raw.question.trim(),
            options,
            correctAnswer: correctIndex,
            explanation,
            difficulty,
            createdBy: context.createdBy,
            // AI content is ALWAYS an unpublished draft. Only a teacher or admin
            // may publish it — the model never gains publication authority.
            isPublished: false,
        },
    };
};

/**
 * Validate a batch, returning accepted questions plus rejection reasons.
 * @returns {{ questions: Array, rejected: Array<{index:number, reason:string}> }}
 */
const validateGeneratedBatch = (rawList, context) => {
    const questions = [];
    const rejected = [];

    if (!Array.isArray(rawList)) return { questions, rejected: [{ index: -1, reason: 'not_an_array' }] };

    rawList.slice(0, AI_LIMITS.MAX_QUESTION_COUNT).forEach((raw, index) => {
        const result = validateGeneratedQuestion(raw, context);
        if (result.ok) questions.push(result.question);
        else rejected.push({ index, reason: result.reason });
    });

    return { questions, rejected };
};

module.exports = {
    sanitizePrompt,
    validateGeneratedQuestion,
    validateGeneratedBatch,
};
