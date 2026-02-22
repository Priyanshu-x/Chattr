require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function debugKeys() {
    console.log("--- KIRA KEY DIAGNOSTICS ---");

    // 1. Test OpenRouter
    const orKey = process.env.OPENROUTER_API_KEY;
    console.log(`\n[1] Testing OpenRouter (Key starts with: ${orKey?.substring(0, 10)}...)`);
    try {
        const orResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${orKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [{ "role": "user", "content": "hi" }]
            })
        });
        const orData = await orResp.json();
        if (orData.error) {
            console.log("❌ OpenRouter Failed:", orData.error);
        } else {
            console.log("✅ OpenRouter Working!");
        }
    } catch (e) {
        console.log("❌ OpenRouter Exception:", e.message);
    }

    // 2. Test Gemini SDK
    const gemKey = process.env.GEMINI_API_KEY;
    console.log(`\n[2] Testing Gemini SDK (Key starts with: ${gemKey?.substring(0, 10)}...)`);
    try {
        const genAI = new GoogleGenerativeAI(gemKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("hi");
        const response = await result.response;
        console.log("✅ Gemini SDK Working!");
    } catch (e) {
        console.log("❌ Gemini SDK Failed:", e.message);
    }
}

debugKeys();
