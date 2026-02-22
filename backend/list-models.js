require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    console.log(`Testing Gemini Key: ${key?.substring(0, 10)}...`);
    try {
        const genAI = new GoogleGenerativeAI(key);
        // We use a simple model.listModels call if available or just try a few known ones
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-flash-latest"];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("test");
                console.log(`✅ Model ${m} is WORKING.`);
            } catch (e) {
                console.log(`❌ Model ${m} failed: ${e.message}`);
            }
        }
    } catch (e) {
        console.log("Fatal Gemini Error:", e.message);
    }
}

listModels();
