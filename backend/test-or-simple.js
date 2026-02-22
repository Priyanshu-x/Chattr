require('dotenv').config();
async function test() {
    console.log("TESTING OPENROUTER KEY...");
    const key = process.env.OPENROUTER_API_KEY;
    console.log("Key Length:", key ? key.length : 0);
    try {
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "HTTP-Referer": "http://localhost:3000",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [{ "role": "user", "content": "hi" }]
            })
        });
        const data = await resp.json();
        console.log("RESPONSE:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("ERROR:", e.message);
    }
}
test();
