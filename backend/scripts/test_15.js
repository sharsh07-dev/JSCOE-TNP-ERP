const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName, version = 'v1') {
    console.log(`Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: version });
        const result = await model.generateContent("Hi");
        console.log(`RESULT: ${result.response.text()}`);
        return true;
    } catch (err) {
        console.error(`ERROR:`, err.message);
        return false;
    }
}

testModel('gemini-1.5-flash').catch(console.error);
