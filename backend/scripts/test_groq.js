const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testGroq() {
    console.log("Testing Groq Fallback (Llama-3.3-70b-versatile)...");
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'user', content: "Hello, say 'GROQ_HIVE_ACTIVE' if you are online." }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        console.log(`RESULT: ${completion.choices[0].message.content}`);
        return true;
    } catch (err) {
        console.error(`ERROR:`, err.message);
        return false;
    }
}

testGroq().catch(console.error);
