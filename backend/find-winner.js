require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function findWinner() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const models = [
            "gemini-flash-latest",
            "gemini-pro-latest",
            "gemini-2.0-flash-lite-001",
            "gemini-2.0-flash",
            "gemma-3-4b-it"
        ];
        let results = "";

        for (const m of models) {
            try {
                console.log(`Checking ${m}...`);
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("hi");
                const response = await result.response;
                results += `✅ ${m}: SUCCESS (${response.text().substring(0, 20)})\n`;
            } catch (e) {
                results += `❌ ${m}: FAILED (${e.message})\n`;
            }
        }
        fs.writeFileSync('winner-results.txt', results);
    } catch (err) {
        fs.writeFileSync('winner-results.txt', "Search failed: " + err.message);
    }
}

findWinner();
