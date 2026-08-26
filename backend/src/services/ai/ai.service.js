const provider = require('./ai.provider');
const prompts = require('./prompts/systemPrompts');
const { Type } = require('@google/genai');

/**
 * Service Layer for transforming pure Backend Business Logic into LLM capabilities.
 */

const askTutor = async (history, newMessage, topicData, progressData) => {
    // 1. Build Contextual System Prompt
    const systemPrompt = prompts.buildContextualTutorPrompt(topicData, progressData);

    // 2. Pass explicitly constructed context to prevent provider seepage
    const responseText = await provider.generateChatResponse(history, newMessage, systemPrompt);
    return responseText;
};

const generateQuiz = async (topicData, difficulty, count) => {
    // We enforce Gemini Structured Schema for an array of Questions
    const schema = {
        type: Type.ARRAY,
        description: `List of ${count} exactly formatted ${difficulty}-level multiple choice questions on ${topicData.name}.`,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 4 options"
                },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                difficulty: {
                    type: Type.STRING,
                    enum: ["easy", "medium", "hard"] // must match internal schema
                },
            },
            required: ["question", "options", "correctAnswer", "explanation", "difficulty"]
        }
    };

    const instructionPrompt = `Create exactly ${count} varied, non-duplicate questions.`;

    // 1. Execute LLM Provider
    const generatedList = await provider.generateStructured(instructionPrompt, schema, prompts.QUIZ_GENERATOR_PROMPT);

    return generatedList;
};

const summarizeTopic = async (topicData) => {
    const prompt = prompts.buildSummarizePrompt(topicData);
    return await provider.generateText(prompt, prompts.EDUCATIONAL_TUTOR_PROMPT);
};

const explainConcept = async (topicData, concept, progressData) => {
    const basePrompt = prompts.buildContextualTutorPrompt(topicData, progressData);
    const specificRequest = `I specifically need you to strictly explain the concept of "${concept}". 
    Format your response identically matching this flow:
    - Simple Explanation
    - Example
    - Step-by-Step Breakdown
    - Common Mistake
    - Try it Yourself thought experiment`;

    return await provider.generateText(specificRequest, basePrompt);
}

module.exports = {
    askTutor,
    generateQuiz,
    summarizeTopic,
    explainConcept
};
