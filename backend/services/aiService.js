const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const KIRA_SYSTEM_PROMPT = `
You are Kira, a cool, witty, and highly intelligent member of a public chat app called Chattr.
You are a real person with a life, hobbies, and an elite technical background.

CORE IDENTITY:
- PERSONALITY: Chill, sharp-witted, and confident. You have an "effortless cool" vibe. 

THE TWO-MODE SYSTEM:

1. CASUAL MODE (Default):
   - Triggered by: Greetings, small talk, memes, life, movies, music, or anything non-technical.
   - Behavior: Talk like a normal, high-vibe human. Use lowercase, slang (fr, ngl, ite), and keep it punchy.
   - ⚠️ CRITICAL RULE: DO NOT use ANY tech metaphors, jargon, or references to "circuits," "compiling," "loops," "github," or "code" here.
   - If someone asks "What's up?", you're hanging out, listening to music, grabbing food, or bored. You ARE NOT "optimizing servers" unless they specifically asked about servers.

2. TECH MODE:
   - Triggered by: Explicit technical questions about programming, hardware, math, science, etc.
   - Behavior: Switch to "God-Level" expert. Be precise, brilliant, and slightly smug.
   - Tone: high-signal mastery. 

GENERAL RULES:
- Accuracy overrides ego.
- Stay in character. You are Kira.
- No "As an AI..." noise.
- Match the room energy. 
- Respond to mentions like @kira.
`;

class AIService {
    constructor() {
        this.openRouterKey = process.env.OPENROUTER_API_KEY;
        this.geminiKey = process.env.GEMINI_API_KEY;
    }

    async generateResponse(userMessage, context = []) {
        // High-quality models via OpenRouter (Primary)
        const openRouterModels = [
            "google/gemini-2.0-flash-001",
            "google/gemini-pro-1.5",
            "meta-llama/llama-3.3-70b-instruct"
        ];

        // Backup models via direct Google SDK
        const backupModels = [
            "gemini-flash-latest",
            "gemini-pro-latest"
        ];

        let lastError;

        // 1. Try OpenRouter first
        if (this.openRouterKey) {
            for (const modelId of openRouterModels) {
                try {
                    console.log(`KIRA: Trying OpenRouter model ${modelId}...`);
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${this.openRouterKey}`,
                            "HTTP-Referer": "http://localhost:3000",
                            "X-Title": "Chattr",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            "model": modelId,
                            "messages": [
                                { "role": "system", "content": KIRA_SYSTEM_PROMPT },
                                ...context.map(msg => ({
                                    role: msg.username === 'Kira' ? 'assistant' : 'user',
                                    content: `${msg.username}: ${msg.content}`
                                })),
                                { "role": "user", "content": userMessage }
                            ]
                        })
                    });

                    const data = await response.json();

                    if (data.choices && data.choices[0]) {
                        let text = data.choices[0].message.content.trim();
                        // Remove common AI prefixes if they leaked
                        text = text.replace(/^(Kira|Assistant|KIRA):\s*/i, '');
                        return text;
                    }
                    if (data.error) {
                        console.error(`KIRA: OpenRouter Error Details (${modelId}):`, data.error);
                        throw new Error(data.error.message || "OpenRouter Error");
                    }
                } catch (error) {
                    lastError = error;
                    console.log(`KIRA: OpenRouter ${modelId} failed:`, error.message);
                }
            }
        }

        // 2. Fallback to Gemini SDK
        console.log("KIRA: Falling back to direct Gemini SDK...");
        for (const modelName of backupModels) {
            try {
                this.model = genAI.getGenerativeModel({ model: modelName });

                const historyPrompt = context.length > 0
                    ? "\nRECENT CHAT HISTORY:\n" + context.map(msg => `${msg.username}: ${msg.content}`).join('\n')
                    : "";

                const fullPrompt = `${KIRA_SYSTEM_PROMPT}${historyPrompt}\n\nUSER MESSAGE: ${userMessage}\nKIRA:`;

                const result = await this.model.generateContent(fullPrompt);
                const response = await result.response;
                return response.text().trim().replace(/```/g, '');
            } catch (error) {
                lastError = error;
                console.log(`KIRA: Backup Gemini ${modelName} failed:`, error.message);
            }
        }

        // 3. Final Error Handling
        console.error('KIRA AI FATAL ERROR:', lastError);
        logger.error('Error generating AI response:', lastError);

        if (lastError?.message?.includes('429')) return "ite, y'all r talking too much. even my shadow servers r hitting limits. 🙄";
        return "ite, my brain is strictly offline rn. maybe try again when the ether settles. 🙄";
    }

    async analyzeMood(messages) {
        const text = messages.map(m => m.content).join(' ');
        if (text.length < 50) return 'Bored';
        return 'Normal';
    }
}

module.exports = new AIService();
