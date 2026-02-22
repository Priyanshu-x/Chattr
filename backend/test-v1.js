require('dotenv').config();
const fs = require('fs');

async function testV1() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "ite, say 'online'" }] }] })
        });
        const data = await response.json();

        // Also try v1beta with 1.5-flash to compare
        const urlBeta = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const responseBeta = await fetch(urlBeta, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "ite, say 'online'" }] }] })
        });
        const dataBeta = await responseBeta.json();

        fs.writeFileSync('v1-test.txt', JSON.stringify({ v1: data, v1beta: dataBeta }, null, 2));
    } catch (err) {
        fs.writeFileSync('v1-test.txt', "V1 test failed: " + err.message);
    }
}

testV1();
