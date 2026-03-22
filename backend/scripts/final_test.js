const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName, version = 'v1') {
    console.log(`Testing model: ${modelName} on version: ${version}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: version });
        const result = await model.generateContent("Hello, say 'SYSTSEM_READY' if you hear me.");
        process.stdout.write(`RESULT: ${result.response.text()}\n`);
        return true;
    } catch (err) {
        console.error(`ERROR:`, err.message);
        return false;
    }
}

testModel('gemini-2.0-flash').catch(console.error);
