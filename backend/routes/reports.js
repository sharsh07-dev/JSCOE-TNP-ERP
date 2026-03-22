const express = require('express');
const router = express.Router();
const {
    generateReport,
    exportDocx,
    exportPdf,
    getReports,
    getReport,
    updateReport,
    deleteReport,
    getDashboardStats,
    compareDrives,
} = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadMixed } = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Report CRUD
router.get('/', getReports);
router.get('/:reportId', getReport);
router.post('/generate', uploadMixed, generateReport);
router.put('/:reportId', updateReport);
router.delete('/:reportId', deleteReport);

// Export
router.get('/:reportId/export/docx', exportDocx);
router.get('/:reportId/export/pdf', exportPdf);

// Compare drives
router.post('/compare', compareDrives);

// AI Assistant chat
const { answerQuestion } = require('../services/aiChatService');
router.post('/ai-chat', async (req, res) => {
    try {
        const { question, reportId } = req.body;
        if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });
        const answer = await answerQuestion(question.trim(), reportId || null);
        res.json({ answer });
    } catch (err) {
        console.error('AI chat error:', err.message);
        res.status(500).json({ error: 'AI assistant failed: ' + err.message });
    }
});

module.exports = router;
