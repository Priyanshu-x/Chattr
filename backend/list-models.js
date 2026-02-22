require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use the listModels method to get available models
        // Note: This might require specific API permissions but usually works for free tier keys.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log("AVAILABLE MODELS:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name.split('/').pop()} (Supported)`);
                } else {
                    console.log(`- ${m.name.split('/').pop()} (No generateContent)`);
                }
            });
        } else {
            console.log("No models found or error in response:", data);
        }
    } catch (err) {
        console.error("Diagnostic failed:", err);
    }
}

listModels();
