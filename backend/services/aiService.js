const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Universal AI Caller with Fallback
 */
async function callAI(prompt, systemPrompt = "You are an expert TNP coordinator.") {
  try {
    // Try Gemini First (Fastest/Strongest)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }, { apiVersion: 'v1' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    const isQuotaError = err.message.includes('429') || err.message.includes('quota');
    const isModelError = err.message.includes('404') || err.message.includes('not found');
    const isForbidden = err.message.includes('403') || err.message.includes('leaked');
        
    if ((isQuotaError || isModelError || isForbidden) && groq) {
      console.warn(`Gemini Error (Report): ${err.message}. Falling back to Groq (Llama 3)...`);
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.1,
        });
        return completion.choices[0].message.content;
      } catch (groqErr) {
        console.error('Groq Fallback also failed:', groqErr.message);
        throw err; // Throw original Gemini error if Groq also fails
      }
    }
    throw err;
  }
}

/**
 * Process Drive Report
 */
const processDriveReport = async (rawText, excelData = null, chartData = null) => {
  const prompt = `You are an expert Training and Placement Cell (TNP) report generator.
  
RAW INPUT TEXT:
"""
${rawText}
"""

${excelData ? `ADDITIONAL EXCEL DATA:\n${JSON.stringify(excelData, null, 2)}` : ''}

Extract and return ONLY a valid JSON object with this EXACT structure (fill with "N/A" if not found):
{
  "reportType": "drive",
  "header": { "collegeName": "", "cellName": "Training and Placement Cell", "reportTitle": "Campus Drive Report", "academicYear": "" },
  "companyDetails": { "companyName": "", "industrySector": "", "driveDate": "", "driveVenue": "" },
  "jobDetails": { "jobRole": "", "ctcOffered": "", "location": "" },
  "selectionProcess": { "rounds": [], "totalRounds": 0 },
  "attendanceData": { "totalRegistered": 0, "totalAttended": 0, "branchWise": [] },
  "selectionResults": { "totalSelected": 0, "selectionRatio": "", "branchWiseResults": [] },
  "keyStatistics": { "offersGiven": 0, "averageCTC": "", "highestCTC": "" },
  "conclusion": "",
  "coordinatorName": "",
  "hodName": "",
  "tpOfficerName": ""
}
Return only JSON.`;

  const text = await callAI(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');

  const parsed = JSON.parse(jsonMatch[0]);
  parsed.aiSuggestions = await generateAISuggestions(parsed, 'drive');
  return parsed;
};

/**
 * Process Session Report
 */
const processSessionReport = async (rawText, excelData = null) => {
  const prompt = `Convert this raw text into a structured SESSION REPORT JSON.
  
RAW INPUT:
"""
${rawText}
"""

${excelData ? `EXCEL DATA:\n${JSON.stringify(excelData, null, 2)}` : ''}

Return ONLY valid JSON:
{
  "reportType": "session",
  "header": { "collegeName": "", "cellName": "Training and Placement Cell", "reportTitle": "Session Report", "departmentName": "" },
  "sessionDetails": { "sessionTitle": "", "topic": "", "sessionDate": "", "venue": "" },
  "speakerDetails": { "name": "", "designation": "", "organization": "" },
  "objectivesAndOutcomes": { "objectives": [], "learningOutcomes": [] },
  "attendanceData": { "totalAttended": 0, "branchWise": [] },
  "sessionContent": { "keyTopicsCovered": [], "sessionSummary": "" },
  "feedbackSummary": { "overallRating": "" },
  "coordinatorName": "",
  "hodName": ""
}
Return ONLY JSON.`;

  const text = await callAI(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');

  const parsed = JSON.parse(jsonMatch[0]);
  parsed.aiSuggestions = await generateAISuggestions(parsed, 'session');
  return parsed;
};

/**
 * Process Management Report
 */
const processManagementReport = async (rawText, excelData = null) => {
  const prompt = `Convert this raw placement updates into a structured MANAGEMENT REPORT JSON.
  
RAW INPUT:
"""
${rawText}
"""

Return ONLY valid JSON:
{
  "reportType": "management",
  "header": { "collegeName": "", "reportPeriod": "", "submittedTo": "", "preparedBy": "" },
  "executiveSummary": "",
  "weeklyActivities": { "drives": [], "sessions": [] },
  "placementStatistics": { "totalStudentsPlaced": 0, "totalOffers": 0, "companiesVisited": 0, "averageCTC": "" },
  "trainingUpdate": { "ongoingSessions": [], "studentsUnderTraining": 0 },
  "challenges": [],
  "recommendations": [],
  "coordinatorRemarks": ""
}
Return ONLY JSON.`;

  const text = await callAI(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');

  const parsed = JSON.parse(jsonMatch[0]);
  parsed.aiSuggestions = await generateAISuggestions(parsed, 'management');
  return parsed;
};

/**
 * AI Suggestions
 */
const generateAISuggestions = async (reportData, reportType) => {
  const prompt = `Based on this ${reportType} report data, provide 5 specific actionable suggestions.
Data: ${JSON.stringify(reportData).substring(0, 2000)}
Return JSON array:
[ { "category": "...", "suggestion": "...", "priority": "...", "impact": "..." } ]
Return only JSON array.`;

  try {
    const text = await callAI(prompt);
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
};

/**
 * Calculate KPI
 */
const calculateKPIScore = async (reportData) => {
  const prompt = `Analyze this TNP drive report and return a KPI score as an integer from 0 to 100 (where 100 is perfect performance). Consider: selection rate, attendance rate, number of hires, and company profile.
Data: ${JSON.stringify(reportData).substring(0, 2000)}
Return ONLY valid JSON: { "overallScore": <integer 0-100>, "grade": "A/B/C/D/F", "insights": ["..."] }`;

  try {
    const text = await callAI(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    // Clamp: Ensure overallScore is always between 0 and 100
    parsed.overallScore = Math.max(0, Math.min(100, Math.round(parsed.overallScore || 0)));
    return parsed;
  } catch {
    return null;
  }
};

module.exports = {
  processDriveReport,
  processSessionReport,
  processManagementReport,
  generateAISuggestions,
  calculateKPIScore,
};
