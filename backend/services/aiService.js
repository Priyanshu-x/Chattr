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
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    }

    async generateResponse(userMessage, context = []) {
        // Verified working models for this specific API key/region
        const modelsToTry = [
            "gemini-flash-latest",
            "gemma-3-4b-it",
            "gemini-pro-latest"
        ];
        let lastError;

        for (const modelName of modelsToTry) {
            try {
                this.model = genAI.getGenerativeModel({ model: modelName });

                const historyPrompt = context.length > 0
                    ? "\nRECENT CHAT HISTORY:\n" + context.map(msg => `${msg.username}: ${msg.content}`).join('\n')
                    : "";

                const fullPrompt = `${KIRA_SYSTEM_PROMPT}${historyPrompt}\n\nUSER MESSAGE: ${userMessage}\nKIRA:`;

                const result = await this.model.generateContent(fullPrompt);
                const response = await result.response;
                let text = response.text().trim();
                text = text.replace(/```/g, '');
                return text;
            } catch (error) {
                lastError = error;
                const errorStr = error.toString().toLowerCase();
                const status = error.status || (errorStr.includes('404') ? 404 : errorStr.includes('429') ? 429 : 500);

                if (status === 404) {
                    console.log(`KIRA: ${modelName} failed with 404, trying next...`);
                    continue;
                }

                if (status === 429) {
                    console.log(`KIRA: ${modelName} hit quota limit (429), trying next...`);
                    continue;
                }

                break; // Stop if it's a critical error (like Auth)
            }
        }

        // If we get here, all models failed
        console.error('KIRA AI ERROR DETAILS:', lastError);
        logger.error('Error generating AI response:', lastError);

        if (lastError?.message?.includes('429') || lastError?.status === 429) {
            return "ite, y'all r talking too much. i'm on a free tier here. wait a minute or buy me some compute. 🙄";
        }

        if (lastError?.message?.includes('API key not valid')) {
            return "ite, u gave me a fake API key. skill issue. tell the admin to git gud. 🙄";
        }

        return "ite, my circuits r frying. legacy code issues. try again later. 🙄";
    }

    /**
     * Analyze sentiment of the chat to determine Kira's "Mood"
     * Returns: 'Normal', 'Bored', 'Annoyed', 'Safe'
     */
    async analyzeMood(messages) {
        // Simple heuristic for now, or use Gemini for complex detection
        const text = messages.map(m => m.content).join(' ');
        if (text.length < 50) return 'Bored';
        if (text.includes('?')) return 'Normal';
        return 'Normal';
    }
}

module.exports = new AIService();
