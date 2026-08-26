const { GoogleGenAI } = require('@google/genai');

/**
 * Initializes and exports the strict underlying provider SDK.
 * Exclusively uses environment variables to prevent accidental credential leakage.
 */

// We instantiate it lazily and handle missing keys securely without crashing the whole server.
let aiClient = null;

const getClient = () => {
    if (aiClient) return aiClient;

    // Explicit server-side env extraction
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_actual_gemini_api_key_here') {
        console.warn("⚠️ AI_API_KEY is not defined. AI Features will return graceful fallback mock data.");
        return null; // Return null to trigger mock mode downstream
    }

    aiClient = new GoogleGenAI({ apiKey: apiKey });
    return aiClient;
};

/**
 * High level text generation wrapper ensuring consistent response signatures.
 */
const generateText = async (prompt, systemInstruction = null) => {
    const client = getClient();

    if (!client) {
        // Return mock data for UI demonstration
        return "🤖 **Mocked AI Tutor Mode**\n\nI see you're trying to use my brain, but the `AI_API_KEY` is completely missing from the backend `.env` file! \n\nIf I was fully connected, this is exactly where I would provide a hyper-personalized, dynamically generated explanation based on your exact historical learning records and current progress metrics.";
    }

    const model = process.env.AI_MODEL || 'gemini-3.6-flash';
    const temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;

    const config = {
        temperature,
        systemInstruction,
    };

    try {
        const response = await client.models.generateContent({
            model,
            contents: prompt,
            config
        });
        return response.text;
    } catch (error) {
        console.error("AI Provider Error (Text):", error.message);
        throw new Error("The AI service is temporarily unavailable.");
    }
};

/**
 * High level structured JSON generation.
 * Forces application/json MIME to guarantee predictable parsing.
 */
const generateStructured = async (prompt, jsonSchema, systemInstruction = null) => {
    const client = getClient();

    if (!client) {
        // Return mock structured JSON arrays for UI bounding 
        return {
            title: "Mocked Concept Quiz",
            description: "A placeholder quiz generated securely to demonstrate UI capabilities without spending API credits.",
            questions: [
                {
                    title: "What is the primary role of the SmartLearn AI Architecture?",
                    options: ["To isolate data", "To unify Learning, Practice, and Assessments adaptively", "To randomize questions", "To bypass security"],
                    correctAnswer: "To unify Learning, Practice, and Assessments adaptively",
                    difficulty: "beginner",
                    explanation: "This is a demonstration explanation highlighting the adaptive nature of Phase 8!"
                },
                {
                    title: "How is Mastery Score historically maintained?",
                    options: ["It resets every day", "It uses 100% of the new score", "It blends 70% incoming with 30% stored data", "It is arbitrary"],
                    correctAnswer: "It blends 70% incoming with 30% stored data",
                    difficulty: "intermediate",
                    explanation: "Our deterministic algorithm precisely balances historical credibility with fresh executions."
                }
            ]
        };
    }

    const model = process.env.AI_MODEL || 'gemini-3.6-flash';

    const config = {
        temperature: 0.2, // Lower temp for structured arrays 
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: jsonSchema
    };

    try {
        const response = await client.models.generateContent({
            model,
            contents: prompt,
            config
        });

        let text = response.text;
        // Strip markdown backticks if Gemini inadvertently outputs them around JSON
        if (text.startsWith('```json')) text = text.slice(7, -3);
        else if (text.startsWith('```')) text = text.slice(3, -3);

        return JSON.parse(text);
    } catch (error) {
        console.error("AI Provider Error (Structured):", error.message);
        throw new Error("Calculated failure retrieving strict structured output from AI.");
    }
};

/**
 * Stateful multi-turn chat wrapper
 */
const generateChatResponse = async (history, newMessage, systemInstruction = null) => {
    const client = getClient();

    if (!client) {
        return "🤖 **AI Demo Mode:** Hey there! You are interacting with the secure fallback mode. If you provide a Gemini API Key to the engine, I'll activate securely. For now, enjoy exploring the conversational interface!";
    }

    const model = process.env.AI_MODEL || 'gemini-3.6-flash';

    try {
        // Map history to Gemini API signature
        // The backend model saves 'user' and 'assistant' natively
        const formattedHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const chat = client.chats.create({
            model,
            config: {
                systemInstruction,
                temperature: 0.7,
            },
            history: formattedHistory
        });

        const response = await chat.sendMessage({ message: newMessage });
        return response.text;
    } catch (error) {
        console.error("AI Provider Error (Chat):", error.message);
        throw new Error("Chat engine currently unavailable.");
    }
}


module.exports = {
    generateText,
    generateStructured,
    generateChatResponse
};
