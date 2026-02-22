const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// Lazy initialization for Gemini SDK
let genAI;
const getGenAI = () => {
    if (!genAI && process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
};

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
        this.clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
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

        // Diagnostic Log
        if (!this.openRouterKey && !this.geminiKey) {
            console.error("KIRA CRITICAL: No API keys found in environment variables!");
            return "ite, i'm strictly offline because the admin forgot my brain keys. skill issue. 🙄";
        }

        // 1. Try OpenRouter first
        if (this.openRouterKey) {
            for (const modelId of openRouterModels) {
                try {
                    console.log(`KIRA: Fetching from OpenRouter [${modelId}]...`);
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${this.openRouterKey}`,
                            "HTTP-Referer": this.clientUrl,
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

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    if (data.choices && data.choices[0]) {
                        let text = data.choices[0].message.content.trim();
                        // Remove common AI prefixes if they leaked
                        text = text.replace(/^(Kira|Assistant|KIRA):\s*/i, '');
                        return text;
                    }
                } catch (error) {
                    lastError = error;
                    console.error(`KIRA ERROR [OpenRouter - ${modelId}]:`, error.message);
                }
            }
        }

        // 2. Fallback to Gemini SDK
        console.log("KIRA: Falling back to direct Gemini SDK...");
        const sdk = getGenAI();
        if (sdk) {
            for (const modelName of backupModels) {
                try {
                    this.model = sdk.getGenerativeModel({ model: modelName });

                    const historyPrompt = context.length > 0
                        ? "\nRECENT CHAT HISTORY:\n" + context.map(msg => `${msg.username}: ${msg.content}`).join('\n')
                        : "";

                    const fullPrompt = `${KIRA_SYSTEM_PROMPT}${historyPrompt}\n\nUSER MESSAGE: ${userMessage}\nKIRA:`;

                    const result = await this.model.generateContent(fullPrompt);
                    const response = await result.response;
                    return response.text().trim().replace(/```/g, '');
                } catch (error) {
                    lastError = error;
                    console.error(`KIRA ERROR [Gemini SDK - ${modelName}]:`, error.message);
                }
            }
        } else {
            console.log("KIRA: Gemini fallback unavailable (no key).");
        }

        // 3. Final Error Handling
        if (lastError) {
            logger.error('Kira AI Fatal:', lastError);
            if (lastError.message?.includes('429')) return "ite, y'all r talking too much. even my shadow servers r hitting limits. 🙄";
            return "ite, my brain is strictly offline rn. maybe try again when the ether settles. 🙄";
        }

        return "ite, something went wrong and i don't even know what. check the logs. 🙄";
    }

    async analyzeMood(messages) {
        // Diagnosis helper via /kira status
        if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) return 'Offline (Keys Missing)';
        const text = messages.map(m => m.content).join(' ');
        if (text.length < 50) return 'Bored';
        return 'Normal';
    }
}

module.exports = new AIService();
