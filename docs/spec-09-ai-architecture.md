# SmartLearn AI — Technical Specification
## Section 9: AI Architecture

---

## 9.1 Principles

1. **Backend-only AI**: The LLM API key is never exposed to the frontend. All AI calls are made server-side.
2. **Pluggable provider**: The AI provider (OpenAI, Gemini, Anthropic) is selected via `AI_PROVIDER` env var.
3. **Structured output**: Every AI response is validated for schema before being returned to the client.
4. **Graceful degradation**: AI failures return a user-friendly message; they never crash the learning flow.
5. **Rate limiting**: Per-user daily AI call quotas enforced to control costs.

---

## 9.2 AI Service Architecture

```
/services/ai/
  aiClient.js          → Initializes LLM SDK based on AI_PROVIDER env var
  promptService.js     → Builds validated prompts per use case
  aiService.js         → Orchestrates: build prompt → call LLM → validate response → return
  aiValidator.js       → JSON schema validation of AI responses
  aiRateLimiter.js     → Per-user quota tracking (Redis or MongoDB counter)
```

---

## 9.3 AI Use Cases

### 9.3.1 AI Tutor (Conversational)

**Trigger**: Student sends message in tutor chat for a topic.

**Prompt structure:**
```
System: You are a helpful, concise AI tutor for {topicTitle} at {difficulty} level.
        Keep responses under 300 words. Use simple examples. 
        Do NOT make up facts. If unsure, say so.
Context: Last 5 messages of conversation.
User: {studentMessage}
```

**Response**: Plain text (streamed via SSE). Saved to `AIConversation` collection.

---

### 9.3.2 Explanation Generation

**Trigger**: Student requests explanation of a concept.

**Prompt:**
```
System: You are an expert educator. Explain the concept "{concept}" within the topic 
        "{topicTitle}" clearly and concisely (max 250 words). 
        Include 1 real-world example. Return plain text.
```

---

### 9.3.3 Quiz Generation

**Trigger**: Teacher or student requests AI-generated quiz.

**Prompt:**
```
System: Generate {count} multiple-choice questions about "{topicTitle}" 
        at {difficulty} difficulty. 
        Return ONLY valid JSON. Schema:
        [{ "text": "...", "options": [{"label":"A","text":"..."},...], 
           "correctOption": "A", "explanation": "..." }]
        No additional text outside JSON.
```

**Response validation** (aiValidator.js):
- Parse JSON.
- Validate each question has `text`, 4 options (A–D), valid `correctOption`, `explanation`.
- Reject and retry once if invalid (max 1 retry).
- If still invalid, return `500` with user-friendly error.

---

### 9.3.4 Study Plan Generation

**Trigger**: Student requests AI study plan.

**Prompt:**
```
System: You are an adaptive learning planner. Given the student profile and topic 
        priorities, generate a personalized study plan.
        Return ONLY valid JSON. Schema:
        { "tasks": [{ "topicId": "...", "day": 1, "durationMinutes": 30, 
                       "type": "learn|quiz|revise" }] }

Student: dailyMinutes={dailyMinutes}, targetDate={targetDate}
Weak topics: {weakTopics[]}
Priority order: {sortedTopics[]}
```

---

### 9.3.5 Summarization

**Trigger**: Student requests a topic summary.

**Prompt:**
```
System: Summarize the topic "{topicTitle}" in exactly 5 key bullet points, 
        each max 20 words. Plain text only.
```

---

## 9.4 Prompt Service Design

```js
// promptService.js
const prompts = {
  tutor: (topic, difficulty, history, message) => ({ system: ..., messages: [...] }),
  explain: (topic, concept) => ({ system: ..., messages: [...] }),
  generateQuiz: (topic, count, difficulty) => ({ system: ..., messages: [...] }),
  studyPlan: (profile, topics) => ({ system: ..., messages: [...] }),
  summarize: (topic) => ({ system: ..., messages: [...] })
};
module.exports = prompts;
```

All prompts include:
- An explicit instruction to return structured JSON where applicable.
- A length cap instruction.
- An explicit "no hallucination" instruction.

---

## 9.5 Rate Limiting & Cost Control

| Strategy | Detail |
|---|---|
| **Per-user daily quota** | Default: 20 AI requests/day (admin-configurable) |
| **Quota tracking** | Stored in MongoDB `SystemSettings` or Redis counter |
| **Token limit** | `max_tokens` capped per use case (tutor: 500, quiz: 2000, plan: 1500) |
| **Model selection** | Use cheaper model for summarize/explain; premium model for quiz/plan |
| **Caching** | Summaries cached per topic for 24h to avoid repeated generation |

---

## 9.6 Error Handling

```
LLM timeout (> 15s)  → Return: { error: "AI is taking too long. Please try again." }
Invalid JSON output   → Retry once → If still invalid: { error: "AI response malformed." }
Quota exceeded        → Return 429: { error: "Daily AI limit reached." }
Provider error (5xx)  → Return 503: { error: "AI service temporarily unavailable." }
```

All AI errors are logged server-side with timestamp, userId, useCase (no prompt content in prod logs).

---

## 9.7 Hallucination Mitigation

- System prompts explicitly instruct: *"Do not invent information. If unsure, say 'I don't know'."*
- Quiz explanations are cross-referenced against topic description where possible.
- AI-generated questions are shown to teacher for review before publishing.
- AI tutor responses are saved and can be flagged by students for review.
