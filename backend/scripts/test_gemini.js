const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const testKey = 'AIzaSyD4KngFKvlvU3gKuqWjHLmANGLsru9dQh4';
const genAI = new GoogleGenerativeAI(testKey);

async function testModel(modelName, version = 'v1') {
    console.log(`Testing model: ${modelName} on version: ${version}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: version });
        const result = await model.generateContent("Hello, say 'Test OK' if you hear me.");
        console.log(`Result for ${modelName}:`, result.response.text());
        return true;
    } catch (err) {
        console.error(`Error for ${modelName}:`, err.message);
        return false;
    }
}

async function runTests() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro', 'gemini-2.0-flash-exp'];
    const versions = ['v1', 'v1beta'];

    for (const v of versions) {
        for (const m of models) {
            const ok = await testModel(m, v);
            if (ok) {
                console.log(`\n✅ FOUND WORKING MODEL/VERSION: ${m} / ${v}`);
                process.exit(0);
            }
        }
    }
}

runTests();
