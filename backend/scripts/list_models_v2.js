const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAllModels() {
    console.log("Fetching models...");
    try {
        // Note: The method is genAI.getGenerativeModel().listModels but actually 
        // it's on a base object usually.
        // In SDK v0.24.1, it's just a top-level export or part of the instance? 
        // Wait, let's check the SDK source properly or use a simpler fetch.

        // According to SDK docs, we can iterate over models.
        for await (const model of genAI.listModels()) {
            console.log(model.name, model.supportedGenerationMethods);
        }
    } catch (err) {
        console.error("Failed to list models:", err.message);
    }
}

listAllModels();
