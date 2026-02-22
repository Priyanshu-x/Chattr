require('dotenv').config();
const aiService = require('./services/aiService');

async function verifyKira() {
    console.log("--- KIRA INTEGRATION VERIFICATION ---");

    const testCases = [
        {
            name: "Casual Mode Test",
            message: "yo kira, what's good?",
            context: []
        },
        {
            name: "Tech Mode Test",
            message: "can you explain how a binary search tree works?",
            context: []
        },
        {
            name: "Context Handling Test",
            message: "that sounds complicated, simplify it?",
            context: [
                { username: "User1", content: "can you explain how a binary search tree works?" },
                { username: "Kira", content: "ite, it's just a way to organize data where each node has at most two children. it makes searching way faster. 🧠" }
            ]
        }
    ];

    for (const test of testCases) {
        console.log(`\nTEST: ${test.name}`);
        console.log(`User: ${test.message}`);
        try {
            const response = await aiService.generateResponse(test.message, test.context);
            console.log(`Kira: ${response}`);
        } catch (error) {
            console.error(`❌ Test Failed:`, error.message);
        }
    }
}

verifyKira();
