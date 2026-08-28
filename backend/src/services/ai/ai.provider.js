const { GoogleGenAI } = require('@google/genai');
const logger = require('../../utils/logger');

/**
 * AI provider adapter.
 *
 * The API key is read from the environment only and never leaves this module.
 * Raw provider errors are logged here and replaced with generic messages, since
 * they can embed endpoint URLs and key fragments.
 *
 * Demo mode: when no key is configured, development returns clearly-labelled
 * placeholder text so the UI can be demonstrated. In PRODUCTION this is refused —
 * shipping fabricated "AI" answers to real students would be dishonest, and
 * Phase 11 requires no mock responses in production paths. The controller turns
 * the resulting failure into a friendly 503 and core learning continues to work.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

const PLACEHOLDER_KEYS = ['your_actual_gemini_api_key_here', 'your_gemini_api_key_here', 'sk-...'];

let aiClient = null;
let warnedMissingKey = false;

const getClient = () => {
    if (aiClient) return aiClient;

    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey || PLACEHOLDER_KEYS.includes(apiKey)) {
        if (!warnedMissingKey) {
            warnedMissingKey = true;
            logger.warn('ai.not_configured', {
                effect: IS_PROD
                    ? 'AI endpoints will return 503. Core learning features are unaffected.'
                    : 'Development demo responses will be returned.',
            });
        }
        return null;
    }

    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
};

/** Whether real AI calls can be made. Used by health/status reporting. */
const isConfigured = () => Boolean(getClient());

/** Consistent failure for an unconfigured provider. */
const notConfiguredError = () => new Error('AI provider is not configured (missing API key).');

const DEMO_PREFIX = '**Demo mode — AI is not configured on this server.**\n\n';

const getModel = () => process.env.AI_MODEL || 'gemini-2.5-flash';

// ─── Plain text ────────────────────────────────────────────────────────────
const generateText = async (prompt, systemInstruction = null) => {
    const client = getClient();

    if (!client) {
        if (IS_PROD) throw notConfiguredError();
        return `${DEMO_PREFIX}With an API key configured, a personalised explanation based on your current mastery would appear here.`;
    }

    const temperature = Number.parseFloat(process.env.AI_TEMPERATURE) || 0.7;

    try {
        const response = await client.models.generateContent({
            model: getModel(),
            contents: prompt,
            config: { temperature, systemInstruction },
        });
        return response.text;
    } catch (error) {
        logger.aiFailure('generate_text', { error: error.message });
        throw new Error('The AI service is temporarily unavailable.');
    }
};

// ─── Structured JSON ───────────────────────────────────────────────────────
/**
 * Forces application/json so the response is parseable. The caller must still
 * validate the shape (see utils/aiGuard.js) — a schema request is not a guarantee.
 */
const generateStructured = async (prompt, jsonSchema, systemInstruction = null) => {
    const client = getClient();

    if (!client) {
        if (IS_PROD) throw notConfiguredError();
        // Demo questions are shaped exactly like real output so the validation
        // path is exercised in development too.
        return {
            title: 'Demo quiz (AI not configured)',
            questions: [
                {
                    question: 'Demo mode: what does SmartLearn AI adapt to?',
                    options: [
                        'Your measured mastery per topic',
                        'The time of day',
                        'Alphabetical topic order',
                        'A fixed syllabus only',
                    ],
                    correctAnswer: 'Your measured mastery per topic',
                    difficulty: 'easy',
                    explanation: 'Recommendations are derived from your Progress records.',
                },
            ],
        };
    }

    try {
        const response = await client.models.generateContent({
            model: getModel(),
            contents: prompt,
            config: {
                temperature: 0.2, // lower temperature for structured output
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: jsonSchema,
            },
        });

        let text = (response.text || '').trim();

        // Some models wrap JSON in a markdown fence despite the MIME request.
        if (text.startsWith('```')) {
            text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
        }

        return JSON.parse(text);
    } catch (error) {
        logger.aiFailure('generate_structured', { error: error.message });
        throw new Error('The AI service returned an unusable response.');
    }
};

// ─── Multi-turn chat ───────────────────────────────────────────────────────
const generateChatResponse = async (history, newMessage, systemInstruction = null) => {
    const client = getClient();

    if (!client) {
        if (IS_PROD) throw notConfiguredError();
        return `${DEMO_PREFIX}Ask me anything once an API key is set. Your progress, quizzes and recommendations all work normally without me.`;
    }

    try {
        // Gemini expects 'model' where we store 'assistant'.
        const formattedHistory = (history || []).map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const chat = client.chats.create({
            model: getModel(),
            config: { systemInstruction, temperature: 0.7 },
            history: formattedHistory,
        });

        const response = await chat.sendMessage({ message: newMessage });
        return response.text;
    } catch (error) {
        logger.aiFailure('chat', { error: error.message });
        throw new Error('The AI tutor is temporarily unavailable.');
    }
};

module.exports = {
    generateText,
    generateStructured,
    generateChatResponse,
    isConfigured,
};
