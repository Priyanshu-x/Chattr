require('dotenv').config();
const aiService = require('./services/aiService');

async function finalVerify() {
    console.log("--- KIRA FINAL PERSONALITY CHECK ---");

    try {
        console.log("\n[TEST] Tech Mode:");
        const techRes = await aiService.generateResponse("How do I fix a CORS error in Node?");
        console.log("Kira:", techRes);

        console.log("\n[TEST] Casual Mode:");
        const casualRes = await aiService.generateResponse("Yo Kira, how's your day going?");
        console.log("Kira:", casualRes);

    } catch (e) {
        console.error("❌ Final Check Failed:", e.message);
    }
}

finalVerify();
