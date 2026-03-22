const { getDb } = require('../config/firebase');
const {
    processDriveReport,
    processSessionReport,
    processManagementReport,
    calculateKPIScore,
} = require('../services/aiService');
const {
    generateDriveReportDocx,
    generateSessionReportDocx,
    generateManagementReportDocx,
} = require('../services/docxService');
const {
    generateDriveReportPdf,
    generateSessionReportPdf,
    generateManagementReportPdf,
} = require('../services/pdfService');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

/**
 * Parse Excel file to JSON
 */
const parseExcel = (filePath) => {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(sheet);
    } catch (err) {
        console.error('Excel parse error:', err);
        return null;
    }
};

/**
 * Generate a report from raw text input
 */
const generateReport = async (req, res) => {
    try {
        const {
            reportType,
            rawText,
            collegeInfo,
            chartConfig,
        } = req.body;

        if (!reportType || !rawText) {
            return res.status(400).json({ error: 'reportType and rawText are required' });
        }

        const validTypes = ['drive', 'session', 'management'];
        if (!validTypes.includes(reportType)) {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        // Parse Excel if uploaded
        let excelData = null;
        if (req.files?.excel?.[0]) {
            excelData = parseExcel(req.files.excel[0].path);
        }

        // Get image paths
        const imagePaths = (req.files?.images || []).map((f) => f.path);

        // Process with AI
        let structuredData;
        if (reportType === 'drive') {
            structuredData = await processDriveReport(rawText, excelData);
        } else if (reportType === 'session') {
            structuredData = await processSessionReport(rawText, excelData);
        } else {
            structuredData = await processManagementReport(rawText, excelData);
        }

        // Override with college info if provided
        if (collegeInfo) {
            const info = typeof collegeInfo === 'string' ? JSON.parse(collegeInfo) : collegeInfo;
            structuredData.header = { ...structuredData.header, ...info };
        }

        // Calculate KPI for drive reports
        if (reportType === 'drive') {
            structuredData.kpiScore = await calculateKPIScore(structuredData);
        }

        // Add image paths to structured data
        structuredData.imagePaths = imagePaths;

        // Store in Firebase
        const reportId = uuidv4();
        const db = getDb();
        const reportRecord = {
            id: reportId,
            type: reportType,
            status: 'completed',
            createdBy: req.user.uid,
            creatorName: req.user.name,
            rawText,
            structuredData,
            imagePaths,
            companyName: structuredData.companyDetails?.companyName || structuredData.sessionDetails?.sessionTitle || 'Management Report',
            title: buildReportTitle(reportType, structuredData),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            chartConfig: chartConfig ? JSON.parse(chartConfig) : null,
        };

        await db.collection('reports').doc(reportId).set(reportRecord);

        res.json({
            success: true,
            reportId,
            structuredData,
            message: 'Report generated successfully',
        });
    } catch (err) {
        console.error('Generate report error:', err);
        res.status(500).json({ error: 'Failed to generate report: ' + err.message });
    }
};

const buildReportTitle = (type, data) => {
    if (type === 'drive') {
        return `Drive Report - ${data.companyDetails?.companyName || 'Company'} (${data.companyDetails?.driveDate || ''})`;
    } else if (type === 'session') {
        return `Session Report - ${data.sessionDetails?.sessionTitle || 'Session'}`;
    }
    return `Management Report - ${data.header?.reportPeriod || new Date().toLocaleDateString()}`;
};

/**
 * Export report as PDF (institutional template format)
 */
const exportPdf = async (req, res) => {
    try {
        const { reportId } = req.params;
        const db = getDb();

        const reportDoc = await db.collection('reports').doc(reportId).get();
        if (!reportDoc.exists) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const report = reportDoc.data();
        const data = report.structuredData;
        const imagePaths = report.imagePaths || [];

        // Attach imagePaths to data so pdfService can embed photos
        data.imagePaths = imagePaths;
        // Attach chartConfig (stored on report root, NOT inside structuredData)
        data.chartConfig = report.chartConfig || ['pie_selection', 'bar_attendance', 'bar_placement'];
        console.log('[exportPdf] type:', report.type, '| chartConfig:', data.chartConfig);

        let buffer;
        if (report.type === 'drive') {
            buffer = await generateDriveReportPdf(data);
        } else if (report.type === 'session') {
            buffer = await generateSessionReportPdf(data);
        } else {
            buffer = await generateManagementReportPdf(data);
        }

        const filename = `${report.type}-report-${reportId.slice(0, 8)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (err) {
        console.error('Export PDF error:', err);
        res.status(500).json({ error: 'Failed to export PDF: ' + err.message });
    }
};

const exportDocx = async (req, res) => {
    try {
        const { reportId } = req.params;
        const db = getDb();

        const reportDoc = await db.collection('reports').doc(reportId).get();
        if (!reportDoc.exists) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const report = reportDoc.data();
        const data = report.structuredData;
        const imagePaths = report.imagePaths || [];

        // Attach chartConfig (stored on report root, NOT inside structuredData)
        // Default to all 3 charts if not set (for older reports)
        data.chartConfig = report.chartConfig || ['pie_selection', 'bar_attendance', 'bar_placement'];

        let buffer;
        if (report.type === 'drive') {
            buffer = await generateDriveReportDocx(data, imagePaths);
        } else if (report.type === 'session') {
            buffer = await generateSessionReportDocx(data, imagePaths);
        } else {
            buffer = await generateManagementReportDocx(data, imagePaths);
        }

        const filename = `${report.type}-report-${reportId.slice(0, 8)}.docx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (err) {
        console.error('Export DOCX error:', err);
        res.status(500).json({ error: 'Failed to export report' });
    }
};

/**
 * Get all reports with filters
 */
const getReports = async (req, res) => {
    try {
        const db = getDb();
        const { type, company, startDate, endDate, limit: qLimit } = req.query;

        let query = db.collection('reports');

        if (req.user.role !== 'admin') {
            query = query.where('createdBy', '==', req.user.uid);
        }
        if (type) query = query.where('type', '==', type);

        const snapshot = await query.limit(Number(qLimit) || 100).get();
        let reports = snapshot.docs.map((doc) => {
            const d = doc.data();
            const { structuredData, rawText, imagePaths: _, ...meta } = d;
            return meta;
        });

        // Filter by company name
        if (company) {
            reports = reports.filter((r) =>
                r.companyName?.toLowerCase().includes(company.toLowerCase())
            );
        }

        // Sort by createdAt desc in memory to bypass Firestore composite index errors completely
        reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(reports);
    } catch (err) {
        console.error('Get reports error:', err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

/**
 * Get single report
 */
const getReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const db = getDb();

        const reportDoc = await db.collection('reports').doc(reportId).get();
        if (!reportDoc.exists) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const report = reportDoc.data();

        // Access control
        if (req.user.role !== 'admin' && report.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(report);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch report' });
    }
};

/**
 * Update structured data for a report
 */
const updateReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { structuredData } = req.body;
        const db = getDb();

        const reportDoc = await db.collection('reports').doc(reportId).get();
        if (!reportDoc.exists) return res.status(404).json({ error: 'Not found' });

        const report = reportDoc.data();
        if (req.user.role !== 'admin' && report.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await db.collection('reports').doc(reportId).update({
            structuredData,
            updatedAt: new Date().toISOString(),
        });

        res.json({ message: 'Report updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update report' });
    }
};

/**
 * Delete a report
 */
const deleteReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const db = getDb();

        const reportDoc = await db.collection('reports').doc(reportId).get();
        if (!reportDoc.exists) return res.status(404).json({ error: 'Not found' });

        const report = reportDoc.data();
        if (req.user.role !== 'admin' && report.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete uploaded files if they exist
        (report.imagePaths || []).forEach((imgPath) => {
            try { fs.unlinkSync(imgPath); } catch (e) { }
        });

        await db.collection('reports').doc(reportId).delete();
        res.json({ message: 'Report deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete report' });
    }
};

/**
 * Get dashboard analytics
 */
const getDashboardStats = async (req, res) => {
    try {
        const db = getDb();
        let query = db.collection('reports');

        if (req.user.role !== 'admin') {
            query = query.where('createdBy', '==', req.user.uid);
        }

        const snapshot = await query.get();
        const reports = snapshot.docs.map((d) => d.data());

        const stats = {
            totalReports: reports.length,
            driveReports: reports.filter((r) => r.type === 'drive').length,
            sessionReports: reports.filter((r) => r.type === 'session').length,
            managementReports: reports.filter((r) => r.type === 'management').length,
            recentReports: reports
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
                .map(({ structuredData, rawText, imagePaths, ...meta }) => meta),
            // Full lightweight list for client-side quick-filter
            allReports: reports.map(({ structuredData, rawText, imagePaths, ...meta }) => meta),
            reportsByMonth: buildMonthlyStats(reports),
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

const buildMonthlyStats = (reports) => {
    const monthly = {};
    reports.forEach((r) => {
        const month = r.createdAt?.slice(0, 7);
        if (month) {
            monthly[month] = (monthly[month] || 0) + 1;
        }
    });
    return Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));
};

/**
 * Compare multiple drive reports
 */
const compareDrives = async (req, res) => {
    try {
        const { reportIds } = req.body;
        if (!Array.isArray(reportIds) || reportIds.length < 2) {
            return res.status(400).json({ error: 'Provide at least 2 report IDs' });
        }

        const db = getDb();
        const comparisons = [];

        for (const id of reportIds.slice(0, 5)) {
            const doc = await db.collection('reports').doc(id).get();
            if (doc.exists && doc.data().type === 'drive') {
                const d = doc.data().structuredData;
                comparisons.push({
                    id,
                    title: doc.data().title,
                    company: d.companyDetails?.companyName,
                    driveDate: d.companyDetails?.driveDate,
                    totalRegistered: d.attendanceData?.totalRegistered || 0,
                    totalSelected: d.selectionResults?.totalSelected || 0,
                    selectionRatio: d.selectionResults?.selectionRatio,
                    ctcOffered: d.jobDetails?.ctcOffered,
                    kpiScore: Math.min(100, Math.max(0, Math.round(d.kpiScore?.overallScore || 0))),
                });
            }
        }

        res.json(comparisons);
    } catch (err) {
        res.status(500).json({ error: 'Failed to compare drives' });
    }
};

module.exports = {
    generateReport,
    exportDocx,
    exportPdf,
    getReports,
    getReport,
    updateReport,
    deleteReport,
    getDashboardStats,
    compareDrives,
};
