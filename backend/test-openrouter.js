// const fetch = require('node-fetch'); // Not needed for Node 18+
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";

async function testOpenRouter() {
    console.log("Testing OpenRouter...");

    // Using global fetch (Node 18+)
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
                "X-Title": "Chattr",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001", // Good default
                "messages": [
                    { "role": "user", "content": "Say 'LGTM' if you can hear me." }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("❌ OpenRouter Error:", data.error);
        } else {
            console.log("✅ OpenRouter Success!");
            console.log("Response:", data.choices[0].message.content);
        }
    } catch (error) {
        console.error("❌ Connection Error:", error.message);
    }
}

testOpenRouter();
