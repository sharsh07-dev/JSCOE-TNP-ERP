'use strict';
/**
 * aiChatService.js
 * Powers the AI Assistant chat. Fetches live Firestore data, builds a rich
 * context snapshot, and sends it together with the user's question to Gemini.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { getDb } = require('../config/firebase');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/** Fetch a compact summary of the database for context */
const buildDatabaseContext = async () => {
    const db = getDb();

    // Fetch up to 50 most recent reports
    const snap = await db.collection('reports')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    const reports = snap.docs.map(d => {
        const r = d.data();
        const sd = r.structuredData || {};
        const cd = sd.companyDetails || {};
        const att = sd.attendanceData || {};
        const sel = sd.selectionResults || {};
        const sess = sd.sessionDetails || {};
        return {
            id: d.id,
            type: r.type,
            academicYear: r.academicYear || sd.header?.academicYear,
            createdAt: r.createdAt?.toDate?.()?.toISOString?.() || null,
            // Drive fields
            company: cd.companyName || null,
            driveDate: cd.driveDate || null,
            driveMode: cd.driveMode || null,
            branch: cd.branch || null,
            registered: att.totalRegistered || 0,
            attended: att.totalAttended || 0,
            shortlisted: sel.totalShortlisted || 0,
            selected: sel.totalSelected || 0,
            ctc: sd.jobDetails?.ctcOffered || null,
            kpiScore: r.kpiScore || null,
            // Session fields
            sessionTitle: sess.sessionTitle || null,
            sessionDate: sess.sessionDate || null,
            sessionType: sess.sessionType || null,
            attendanceRate: att.attendancePercentage || null,
        };
    });

    // Aggregate stats
    const drives = reports.filter(r => r.type === 'drive');
    const sessions = reports.filter(r => r.type === 'session');
    const mgmt = reports.filter(r => r.type === 'management');

    const totalRegistered = drives.reduce((s, r) => s + (r.registered || 0), 0);
    const totalSelected = drives.reduce((s, r) => s + (r.selected || 0), 0);
    const totalAttended = drives.reduce((s, r) => s + (r.attended || 0), 0);
    const companies = [...new Set(drives.map(r => r.company).filter(Boolean))];
    const avgKPI = drives.filter(r => r.kpiScore).length
        ? Math.round(drives.filter(r => r.kpiScore).reduce((s, r) => s + r.kpiScore, 0) / drives.filter(r => r.kpiScore).length)
        : null;

    const summary = {
        totalReports: reports.length,
        driveCount: drives.length,
        sessionCount: sessions.length,
        managementCount: mgmt.length,
        totalRegistered,
        totalAttended,
        totalSelected,
        overallPlacementRate: totalRegistered > 0
            ? `${((totalSelected / totalRegistered) * 100).toFixed(1)}%` : 'N/A',
        uniqueCompanies: companies.length,
        companiesList: companies.slice(0, 20),
        averageKPIScore: avgKPI,
    };

    return { summary, reports };
};

/**
 * Answer a user question using live Firestore data as context.
 * @param {string} question - The user's natural language question
 * @param {string} reportId  - Optional: currently viewed report ID for focused context
 * @returns {string} AI answer (markdown)
 */
const answerQuestion = async (question, reportId = null) => {
    const { summary, reports } = await buildDatabaseContext();

    // If a specific report is requested, surface its full detail
    let focusedReport = null;
    if (reportId) {
        focusedReport = reports.find(r => r.id === reportId) || null;
    }

    const contextJson = JSON.stringify({ summary, recentReports: reports }, null, 2);
    const focusedJson = focusedReport ? JSON.stringify(focusedReport, null, 2) : null;

    const prompt = `You are an intelligent AI assistant for a Training & Placement (T&P) ERP system at an engineering college.
You have access to the college's live placement database. Answer the user's question accurately and concisely using the data provided.

IMPORTANT RULES:
- Answer ONLY based on the provided data. Never make up numbers.
- Be specific: quote actual figures, company names, percentages from the data.
- Format your answer clearly. Use bullet points or short paragraphs.
- If you cannot find the answer in the data, say so honestly.
- Keep answers focused and professional. Max ~200 words unless detail is needed.

DATABASE SNAPSHOT:
${contextJson}

${focusedJson ? `CURRENTLY VIEWED REPORT:\n${focusedJson}\n` : ''}

USER QUESTION: ${question}

ANSWER:`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }, { apiVersion: 'v1' });
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err) {
        const isQuotaError = err.message.includes('429') || err.message.includes('quota');
        const isModelError = err.message.includes('404') || err.message.includes('not found');
        const isForbidden = err.message.includes('403') || err.message.includes('leaked');
        
        if ((isQuotaError || isModelError || isForbidden) && groq) {
            console.warn(`Gemini Error in Chat: ${err.message}. Falling back to Groq...`);
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.1,
            });
            return completion.choices[0].message.content;
        }
        throw err;
    }
};

module.exports = { answerQuestion };
