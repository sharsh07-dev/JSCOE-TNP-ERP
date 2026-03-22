const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { renderSelectionPie, renderAttendanceBar, renderPlacementBar } = require('./chartRenderer');

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const L = 50;          // left margin
const R = PAGE_W - 50; // right margin
const CW = R - L;      // content width
const FS = 9.5;        // default font size

const BLACK = '#000000';
const GREY = '#e8e8e8';

// Table column widths: Sr.No | Field | Value
const COL = [40, 190, CW - 230];
const ROW_H = 21;

// ── Cache header image buffer ──────────────────
let _hBuf = null;
const hBuf = () => {
    if (_hBuf) return _hBuf;
    for (const p of [
        path.join(__dirname, '../../frontend/public/header.png'),
        path.join(__dirname, '../public/header.png'),
    ]) {
        if (fs.existsSync(p)) { _hBuf = fs.readFileSync(p); return _hBuf; }
    }
    return null;
};

// ── Safe page-break check: add new page if less than `need` points remain ──
const ensureSpace = (doc, need = 40) => {
    if (doc.y + need > PAGE_H - 50) doc.addPage();
};

// ── Letterhead ──────────────────────────────────
const letterhead = (doc) => {
    const buf = hBuf();
    if (buf) {
        const imgW = CW;
        const imgH = Math.round(CW * 0.13); // approx 13% aspect ratio
        doc.image(buf, L, L, { width: imgW });
        doc.y = L + imgH + 14;
        doc.x = L;
    } else {
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#003366')
            .text("JSPM's Jayawantrao Sawant College of Engineering, Pune", L, doc.y, { width: CW, align: 'center' });
        doc.font('Helvetica').fontSize(10).fillColor(BLACK)
            .text('Training & Placement Cell', L, doc.y, { width: CW, align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor('#999').lineWidth(0.5).stroke().lineWidth(1);
        doc.moveDown(0.5);
    }
};

// ── Section divider ─────────────────────────────
const sep = (doc) => {
    doc.moveDown(0.3);
    doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke().lineWidth(1);
    doc.moveDown(0.3);
    doc.x = L;
};

// ── Centred bold title ──────────────────────────
const title = (doc, text) => {
    ensureSpace(doc, 24);
    doc.x = L;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(BLACK)
        .text(text, L, doc.y, { width: CW, align: 'center' });
    doc.moveDown(0.35);
    doc.x = L;
};

// ── Bold left-aligned section heading ───────────
const heading = (doc, text) => {
    ensureSpace(doc, 20);
    doc.x = L;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK)
        .text(text, L, doc.y, { width: CW });
    doc.moveDown(0.15);
    doc.x = L;
};

// ── Normal body text ─────────────────────────────
const body = (doc, text) => {
    ensureSpace(doc, 14);
    doc.x = L;
    doc.font('Helvetica').fontSize(FS).fillColor(BLACK)
        .text(text || 'N/A', L, doc.y, { width: CW, align: 'left', lineGap: 1.2 });
    doc.moveDown(0.25);
    doc.x = L;
};

// ── Bold label + normal value on same line ───────
const lv = (doc, label, value) => {
    ensureSpace(doc, 14);
    doc.x = L;
    doc.font('Helvetica-Bold').fontSize(FS).fillColor(BLACK)
        .text(label + ': ', L, doc.y, { continued: true, width: CW });
    doc.font('Helvetica').fontSize(FS).fillColor(BLACK)
        .text(value || 'N/A', { width: CW - 10 });
    doc.x = L;
};

// ── Bullet point ─────────────────────────────────
const bullet = (doc, text) => {
    ensureSpace(doc, 14);
    doc.x = L;
    doc.font('Helvetica').fontSize(FS).fillColor(BLACK)
        .text('\u2022  ' + (text || 'N/A'), L + 8, doc.y, { width: CW - 8, lineGap: 1 });
    doc.x = L;
};

// ── 3-column summary table ───────────────────────
const summaryTable = (doc, rows) => {
    let y = doc.y;

    const drawRow = (cols, isHeader = false) => {
        if (y + ROW_H > PAGE_H - 50) { doc.addPage(); y = 50; }
        if (isHeader) doc.rect(L, y, CW, ROW_H).fillColor(GREY).fill();

        let x = L;
        cols.forEach((txt, i) => {
            const w = COL[i];
            doc.rect(x, y, w, ROW_H).strokeColor('#888').lineWidth(0.5).stroke().lineWidth(1);
            doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(9).fillColor(BLACK)
                .text(String(txt || 'N/A'), x + 4, y + 5, {
                    width: w - 8, height: ROW_H - 6,
                    lineBreak: false, ellipsis: true,
                });
            x += w;
        });
        y += ROW_H;
    };

    drawRow(['Sr. No.', 'Field', 'Value'], true);
    rows.forEach(r => drawRow(r, false));

    doc.y = y + 6;
    doc.x = L;
};

// ── Signature row ────────────────────────────────
const signatureRow = (doc, left, right) => {
    doc.moveDown(2);
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK)
        .text(left, L, y, { width: CW / 2 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK)
        .text(right, L + CW / 2, y, { width: CW / 2, align: 'right' });
    doc.moveDown(0.5);
    doc.x = L;
};

// ══════════════════════════════════════════════════════
// DRIVE REPORT PDF
// ══════════════════════════════════════════════════════
const generateDriveReportPdf = async (data) => {
    // Pre-render chart PNGs before building the PDF (individually so one failure doesn't block others)
    const charts = data.chartConfig || [];
    const chartBuffers = {};
    console.log('[PDF] chartConfig =', charts);
    if (charts.includes('pie_selection')) {
        try { chartBuffers.pie = await renderSelectionPie(data); console.log('[PDF] pie rendered', chartBuffers.pie?.length); }
        catch (e) { console.error('[PDF] pie render FAILED:', e.message); }
    }
    if (charts.includes('bar_attendance')) {
        try { chartBuffers.bar = await renderAttendanceBar(data); console.log('[PDF] bar rendered', chartBuffers.bar?.length); }
        catch (e) { console.error('[PDF] bar render FAILED:', e.message); }
    }
    if (charts.includes('bar_placement')) {
        try { chartBuffers.trend = await renderPlacementBar(data); console.log('[PDF] trend rendered', chartBuffers.trend?.length); }
        catch (e) { console.error('[PDF] trend render FAILED:', e.message); }
    }

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: L, size: 'A4', autoFirstPage: true });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const c = data.companyDetails || {};
        const j = data.jobDetails || {};
        const att = data.attendanceData || {};
        const sel = data.selectionResults || {};
        const proc = data.selectionProcess || {};
        const ay = data.header?.academicYear || 'N/A';

        // ─────────────────────────────────────────────────────────────────────
        // Helper: 2-column key-value grid (no Sr.No column, tighter rows)
        // ─────────────────────────────────────────────────────────────────────
        const KV_ROW_H = 18;
        const KV_COL = [Math.round(CW * 0.38), Math.round(CW * 0.62)]; // label | value

        const twoColTable = (doc, pairs) => {
            let y = doc.y;
            pairs.forEach(([label, value], i) => {
                if (y + KV_ROW_H > PAGE_H - 50) { doc.addPage(); y = 50; }
                const isSectionHead = value === '__HEADER__';

                if (isSectionHead) {
                    // Full-width shaded header row
                    doc.rect(L, y, CW, KV_ROW_H).fillColor('#dce8f9').fill();
                    doc.rect(L, y, CW, KV_ROW_H).strokeColor('#b0c8e8').lineWidth(0.5).stroke().lineWidth(1);
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a3a5c')
                        .text(label.toUpperCase(), L + 6, y + 4, { width: CW - 12, lineBreak: false });
                } else {
                    const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                    doc.rect(L, y, KV_COL[0], KV_ROW_H).fillColor(bg).fill();
                    doc.rect(L + KV_COL[0], y, KV_COL[1], KV_ROW_H).fillColor(bg).fill();
                    // borders
                    doc.rect(L, y, CW, KV_ROW_H).strokeColor('#d4d4d4').lineWidth(0.4).stroke().lineWidth(1);
                    doc.moveTo(L + KV_COL[0], y).lineTo(L + KV_COL[0], y + KV_ROW_H).strokeColor('#d4d4d4').lineWidth(0.4).stroke().lineWidth(1);
                    // text
                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#374151')
                        .text(String(label), L + 5, y + 4, { width: KV_COL[0] - 10, lineBreak: false, ellipsis: true });
                    doc.font('Helvetica').fontSize(8.5).fillColor('#111827')
                        .text(String(value ?? 'N/A'), L + KV_COL[0] + 5, y + 4, { width: KV_COL[1] - 10, lineBreak: false, ellipsis: true });
                }
                y += KV_ROW_H;
            });
            doc.y = y + 4;
            doc.x = L;
        };

        // ─────────────────────────────────────────────────────────────────────
        // Section header bar (coloured strip with white text)
        // ─────────────────────────────────────────────────────────────────────
        const sectionBar = (doc, text, colour = '#1d4ed8') => {
            ensureSpace(doc, 22);
            doc.rect(L, doc.y, CW, 18).fillColor(colour).fill();
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
                .text(text.toUpperCase(), L + 8, doc.y + 4, { width: CW - 16, lineBreak: false });
            doc.y += 20;
            doc.x = L;
        };

        // ── 1. LETTERHEAD ──────────────────────────────────────────────────
        letterhead(doc);

        // ── 2. TITLE ───────────────────────────────────────────────────────
        title(doc, `Campus Drive Report — ${ay}`);

        // ── 3. QUICK SUMMARY TABLE (compact, no duplicate) ─────────────────
        sectionBar(doc, 'Drive Summary');
        twoColTable(doc, [
            ['Company', c.companyName || 'N/A'],
            ['Academic Year', ay],
            ['Drive Date', c.driveDate || 'N/A'],
            ['Venue', c.driveVenue || 'N/A'],
            ['Mode', c.driveMode || 'Offline'],
            ['Batch', data.header?.batch || 'N/A'],
            ['Branch', c.branch || att.branchWise?.map(b => b.branch).join(', ') || 'All'],
            ['Eligibility Criteria', j.eligibilityCriteria || 'No Backlogs'],
            ['CTC Offered', j.ctcOffered || 'As per norms'],
            ['Registered Students', String(att.totalRegistered || 0)],
            ['Attended', String(att.totalAttended || 0)],
            ['Shortlisted', String(sel.totalShortlisted || 0)],
            ['Finally Selected', String(sel.totalSelected || 0)],
            ['HR Feedback', sel.hrFeedback || 'Awaited'],
        ]);

        // ── 4. DRIVE NARRATIVE ─────────────────────────────────────────────
        sectionBar(doc, 'Drive Details', '#1e3a5f');
        if (data.driveDetails || data.overviewText) {
            body(doc, data.driveDetails || data.overviewText);
        } else {
            const co = c.companyName || 'the company';
            const date = c.driveDate || 'N/A';
            const venue = c.driveVenue || 'the designated venue';
            const mode = c.driveMode || 'Offline';
            const reg = att.totalRegistered || 0;
            const pres = att.totalAttended || 0;
            const short = sel.totalShortlisted || 0;
            const selct = sel.totalSelected || 0;
            const batch = data.header?.batch || 'current';
            const br = c.branch || 'all branches';
            const ay2 = ay;

            body(doc,
                `A campus placement drive was conducted by ${co} on ${date} at ${venue} in ${mode} mode ` +
                `as part of the Training & Placement activities for the academic year ${ay2}. ` +
                `The drive was open to students of the ${batch} batch from ${br}. ` +
                `A total of ${reg} students registered for the drive, demonstrating strong interest ` +
                `from the student community in the opportunity provided by ${co}.`
            );
            body(doc,
                `Prior to the commencement of the selection process, a pre-placement talk was organised ` +
                `by the Training & Placement Cell. During this session, representatives from ${co} ` +
                `presented a detailed overview of the company, its work culture, growth opportunities, ` +
                `roles offered, and the compensation package. Out of the ${reg} registered students, ` +
                `${pres} students were present on the day of the drive and participated in the assessment process.`
            );
            body(doc,
                `The selection process was conducted in multiple rounds as per the company's standard recruitment procedure. ` +
                `Following the aptitude and technical assessments, ${short} students were shortlisted to advance ` +
                `to the subsequent rounds. The shortlisted candidates demonstrated strong academic knowledge, ` +
                `communication skills, and professional aptitude as evaluated by the ${co} panel.`
            );
            body(doc,
                `After the completion of all rounds including the final HR interview, ${selct} student(s) ` +
                `were ultimately selected by ${co} for the offered position(s). ` +
                `The Training & Placement Cell extends its congratulations to the selected student(s) ` +
                `and appreciates the participation of all students who appeared for the drive. ` +
                `The department remains committed to facilitating more such opportunities for students in the future.`
            );
        }

        // ── 5. COMPANY PROFILE ─────────────────────────────────────────────
        const profile = data.companyProfile || c.companyProfile || c.companyDescription;
        if (profile && profile !== 'N/A') {
            sectionBar(doc, 'Company Profile', '#065f46');
            body(doc, profile);
        }

        // ── 6. SELECTION ROUNDS ────────────────────────────────────────────
        sectionBar(doc, 'Selection Process', '#5b21b6');
        if (proc.rounds?.length > 0) {
            proc.rounds.forEach((r, i) => bullet(doc, `Round ${i + 1}: ${r}`));
        } else {
            bullet(doc, 'Round 1: ' + (proc.round1 || 'Aptitude / Group Discussion'));
            bullet(doc, 'Round 2: ' + (proc.round2 || 'Personal Interview (HR Round)'));
        }

        // ── 7. ATTENDANCE SUMMARY ──────────────────────────────────────────
        sectionBar(doc, 'Attendance Summary', '#92400e');
        twoColTable(doc, [
            ['Total Registered', String(att.totalRegistered || 0)],
            ['Total Attended', String(att.totalAttended || 0)],
            ['Attendance Rate', att.totalRegistered > 0
                ? `${((att.totalAttended / att.totalRegistered) * 100).toFixed(1)}%`
                : 'N/A'],
        ]);

        // ── 8. SELECTED CANDIDATES TABLE ──────────────────────────────────
        if (sel.selectedStudents?.length > 0) {
            sectionBar(doc, `Selected Candidates (${sel.selectedStudents.length})`, '#065f46');
            summaryTable(doc, sel.selectedStudents.map((s, i) => [
                String(i + 1),
                s.name || 'N/A',
                `${s.branch || 'N/A'} | Roll: ${s.rollNo || 'N/A'} | CGPA: ${s.cgpa || 'N/A'}`,
            ]));
        }

        // ── 10. CHART IMAGES + DATA ───────────────────────────────────────────
        // Each chart gets its OWN PAGE so nothing overlaps.
        const IMG_H = 230;
        const IMG_PAD = 14;

        const drawChartImage = (buf) => {
            if (!buf) return;
            doc.addPage();
            doc.x = L;
            const imgY = doc.y;
            doc.image(buf, L, imgY, { width: CW, height: IMG_H });
            doc.y = imgY + IMG_H + IMG_PAD;
            doc.x = L;
        };

        // Selection Ratio Pie ── new page, chart then table
        if (charts.includes('pie_selection')) {
            drawChartImage(chartBuffers.pie);
            heading(doc, 'Selection Ratio Analysis:');
            const attS = data.attendanceData || {};
            const selS = data.selectionResults || {};
            const total = attS.totalRegistered || 0;
            const present = attS.totalAttended || 0;
            const shortlisted = selS.totalShortlisted || 0;
            const selected = selS.totalSelected || 0;
            const notSelected = Math.max(0, present - selected);
            summaryTable(doc, [
                ['1', 'Total Registered', String(total)],
                ['2', 'Total Attended', String(present)],
                ['3', 'Shortlisted', String(shortlisted)],
                ['4', 'Finally Selected', String(selected)],
                ['5', 'Not Selected', String(notSelected)],
                ['6', 'Selection Rate', total > 0 ? `${((selected / total) * 100).toFixed(1)}%` : 'N/A'],
                ['7', 'Attendance Rate', total > 0 ? `${((present / total) * 100).toFixed(1)}%` : 'N/A'],
            ]);
        }

        // Attendance by Branch Bar ── new page, chart then table
        if (charts.includes('bar_attendance')) {
            drawChartImage(chartBuffers.bar);
            heading(doc, 'Attendance by Branch:');
            const branchwise = data.attendanceData?.branchWise
                || data.attendanceData?.branchwise
                || data.attendanceData?.branches
                || [];
            if (branchwise.length > 0) {
                summaryTable(doc, branchwise.map((b, i) => [
                    String(i + 1),
                    b.branch || b.branchName || b.name || 'N/A',
                    `Registered: ${b.registered ?? b.registeredCount ?? 0}  |  Attended: ${b.attended ?? b.attendedCount ?? 0}`,
                ]));
            } else {
                const attB = data.attendanceData || {};
                summaryTable(doc, [
                    ['1', 'All Branches — Registered', String(attB.totalRegistered || 0)],
                    ['2', 'All Branches — Attended', String(attB.totalAttended || 0)],
                ]);
            }
        }

        // Placement Trend Bar ── new page, chart then table
        if (charts.includes('bar_placement')) {
            drawChartImage(chartBuffers.trend);
            heading(doc, 'Placement Trend:');
            const attP = data.attendanceData || {};
            const selP = data.selectionResults || {};
            summaryTable(doc, [
                ['1', 'Company', data.companyDetails?.companyName || 'N/A'],
                ['2', 'Drive Date', data.companyDetails?.driveDate || 'N/A'],
                ['3', 'Total Registered', String(attP.totalRegistered || 0)],
                ['4', 'Total Attended', String(attP.totalAttended || 0)],
                ['5', 'Shortlisted', String(selP.totalShortlisted || 0)],
                ['6', 'Finally Selected', String(selP.totalSelected || 0)],
                ['7', 'Overall Placement %', attP.totalRegistered > 0 ? `${((selP.totalSelected / attP.totalRegistered) * 100).toFixed(1)}%` : 'N/A'],
            ]);
        }

        // ── 11. PHOTOS ─────────────────────────────────
        // Each photo on its own dedicated page to prevent overlapping.
        if (data.imagePaths?.length > 0) {
            const validPaths = data.imagePaths.filter(p => { try { return fs.existsSync(p); } catch { return false; } });
            if (validPaths.length > 0) {
                sectionBar(doc, `Event Photos (${validPaths.length})`, '#1e3a5f');
                validPaths.forEach((imgPath, idx) => {
                    try {
                        // Compute image dimensions to determine rendered height
                        const imgW = CW;
                        // Use fit so image never exceeds page height minus margins
                        const maxH = PAGE_H - 140; // letterhead + sectionBar + margin
                        const startY = doc.y;

                        // If not enough space on current page, start a new one
                        if (startY + 200 > PAGE_H - 50) {
                            doc.addPage();
                            doc.x = L;
                        }

                        const imgStartY = doc.y;
                        doc.image(imgPath, L, imgStartY, { width: imgW, fit: [imgW, maxH] });

                        // Advance y by the actual rendered height
                        // PDFKit sets doc.y to the bottom of the image when using fit
                        // but it's unreliable — force advance by using the image aspect
                        const sizeOf = (() => {
                            try {
                                const buf = fs.readFileSync(imgPath);
                                // Read PNG/JPEG dimensions from buffer
                                if (buf[0] === 0x89 && buf[1] === 0x50) { // PNG
                                    const w = buf.readUInt32BE(16);
                                    const h = buf.readUInt32BE(20);
                                    return { w, h };
                                } else if (buf[0] === 0xFF && buf[1] === 0xD8) { // JPEG
                                    for (let i = 2; i < buf.length - 8;) {
                                        const marker = buf.readUInt16BE(i);
                                        const len = buf.readUInt16BE(i + 2);
                                        if (marker >= 0xFFC0 && marker <= 0xFFCF && marker !== 0xFFC4) {
                                            return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
                                        }
                                        i += 2 + len;
                                    }
                                }
                            } catch { }
                            return null;
                        })();

                        let renderedH = 200; // safe fallback
                        if (sizeOf) {
                            const scale = imgW / sizeOf.w;
                            renderedH = Math.min(sizeOf.h * scale, maxH);
                        }

                        doc.y = imgStartY + renderedH + 12;
                        doc.x = L;

                        // Caption below image
                        doc.font('Helvetica').fontSize(8).fillColor('#6b7280')
                            .text(`Photo ${idx + 1} — ${c.companyName || 'Drive'} | ${c.driveDate || ay}`,
                                L, doc.y, { width: CW, align: 'center' });
                        doc.moveDown(0.4);
                        doc.x = L;

                        // Each subsequent photo on a new page
                        if (idx < validPaths.length - 1) doc.addPage();
                    } catch (err) {
                        console.warn('[PDF] Photo embed failed:', err.message);
                    }
                });
            }
        }

        doc.end();
    }); // end Promise
}; // end generateDriveReportPdf

// ══════════════════════════════════════════════════════
// SESSION REPORT PDF
// ══════════════════════════════════════════════════════
const generateSessionReportPdf = (data) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: L, size: 'A4', autoFirstPage: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const s = data.sessionDetails || {};
    const sp = data.speakerDetails || {};
    const att = data.attendanceData || {};
    const ay = data.header?.academicYear || 'N/A';

    letterhead(doc);
    title(doc, `Session Report - ${ay}`);

    summaryTable(doc, [
        ['1', 'Report Type', 'Session'],
        ['2', 'Session Title', s.sessionTitle || 'N/A'],
        ['3', 'Topic', s.topic || 'N/A'],
        ['4', 'Session Type', s.sessionType || 'N/A'],
        ['5', 'Date', s.sessionDate || 'N/A'],
        ['6', 'Time', s.sessionTime || 'N/A'],
        ['7', 'Duration', s.duration || 'N/A'],
        ['8', 'Venue', s.venue || 'N/A'],
        ['9', 'Mode', s.mode || 'N/A'],
        ['10', 'Total Invited', String(att.totalInvited || 0)],
        ['11', 'Total Attended', String(att.totalAttended || 0)],
        ['12', 'Attendance %', att.attendancePercentage || 'N/A'],
    ]);

    sep(doc);
    heading(doc, 'Resource Person Details:');
    lv(doc, 'Name', sp.name);
    lv(doc, 'Designation', sp.designation);
    lv(doc, 'Organization', sp.organization);
    lv(doc, 'Expertise', sp.expertise);

    sep(doc);
    heading(doc, 'Session Details:');
    body(doc, data.sessionContent?.sessionSummary || data.overviewText || 'N/A');

    heading(doc, 'Objectives:');
    (data.objectivesAndOutcomes?.objectives || []).forEach(o => bullet(doc, o));

    heading(doc, 'Learning Outcomes:');
    (data.objectivesAndOutcomes?.learningOutcomes || []).forEach(o => bullet(doc, o));

    heading(doc, 'Key Topics Covered:');
    (data.sessionContent?.keyTopicsCovered || []).forEach(t => bullet(doc, t));

    sep(doc);
    heading(doc, 'Feedback Summary:');
    lv(doc, 'Overall Rating', data.feedbackSummary?.overallRating);
    lv(doc, 'Content Rating', data.feedbackSummary?.contentRating);
    lv(doc, 'Speaker Rating', data.feedbackSummary?.speakerRating);

    sep(doc);
    heading(doc, 'Coordinator Remarks:');
    body(doc, data.coordinatorRemarks || 'N/A');

    sep(doc);
    heading(doc, 'Attendance:');
    body(doc, `Attendance of ${att.totalAttended || 0} students`);

    sep(doc);
    heading(doc, 'Photos');
    if (data.imagePaths?.length > 0) {
        data.imagePaths.forEach(imgPath => {
            try {
                if (fs.existsSync(imgPath)) {
                    ensureSpace(doc, 200);
                    doc.image(imgPath, L, doc.y, { width: CW });
                    doc.moveDown(0.5);
                    doc.x = L;
                }
            } catch (_) { }
        });
    }

    doc.end();
});

// ══════════════════════════════════════════════════════
// MANAGEMENT / HOD WEEKLY REPORT PDF
// ══════════════════════════════════════════════════════
const generateManagementReportPdf = (data) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: L, size: 'A4', autoFirstPage: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const h = data.header || {};
    const ps = data.placementStatistics || {};

    letterhead(doc);
    title(doc, `HOD Weekly Report on T&P \u2014 ${h.reportPeriod || 'N/A'}`);

    summaryTable(doc, [
        ['1', 'Report Type', 'Management / Weekly'],
        ['2', 'Report Period', h.reportPeriod || 'N/A'],
        ['3', 'Report Date', h.reportDate || 'N/A'],
        ['4', 'Submitted To', h.submittedTo || 'N/A'],
        ['5', 'Prepared By', h.preparedBy || 'N/A'],
        ['6', 'Total Students Placed', String(ps.totalStudentsPlaced || 0)],
        ['7', 'Total Offers', String(ps.totalOffers || 0)],
        ['8', 'New Offers This Week', String(ps.newOffersThisWeek || 0)],
        ['9', 'Companies Visited', String(ps.companiesVisited || 0)],
        ['10', 'Average CTC', ps.averageCTC || 'N/A'],
        ['11', 'Highest CTC', ps.highestCTC || 'N/A'],
    ]);

    sep(doc);
    heading(doc, 'Executive Summary:');
    body(doc, data.executiveSummary || 'N/A');

    sep(doc);
    heading(doc, 'Campus Drives This Week:');
    const drives = data.weeklyActivities?.drives || [];
    if (drives.length > 0) {
        drives.forEach(d =>
            bullet(doc,
                `${d.name || d.title || 'N/A'} \u2014 ${d.company || 'N/A'} | ${d.date || 'N/A'} | Students: ${d.students || 0}`)
        );
    } else { body(doc, 'N/A'); }

    sep(doc);
    heading(doc, 'Training Sessions This Week:');
    const sessions = data.weeklyActivities?.sessions || [];
    if (sessions.length > 0) {
        sessions.forEach(s =>
            bullet(doc,
                `${s.name || s.title || 'N/A'} \u2014 ${s.speaker || 'N/A'} | ${s.date || 'N/A'} | Attendance: ${s.attendance || 0}`)
        );
    } else { body(doc, 'N/A'); }

    sep(doc);
    heading(doc, 'KPI Metrics:');
    lv(doc, 'Drive Success Rate', data.kpiMetrics?.driveSuccessRate || 'N/A');
    lv(doc, 'Session Attendance Rate', data.kpiMetrics?.sessionAttendanceRate || 'N/A');
    lv(doc, 'Placement Rate', data.kpiMetrics?.placementRate || 'N/A');

    sep(doc);
    heading(doc, 'Pending Actions:');
    (data.pendingActions?.items?.length > 0 ? data.pendingActions.items : ['N/A'])
        .forEach(item => bullet(doc, item));

    sep(doc);
    heading(doc, 'Challenges & Recommendations:');
    (data.challenges || []).forEach(c => bullet(doc, 'Challenge: ' + c));
    (data.recommendations || []).forEach(r => bullet(doc, 'Recommendation: ' + r));
    if (!data.challenges?.length && !data.recommendations?.length) body(doc, 'N/A');

    sep(doc);
    heading(doc, 'Coordinator Remarks:');
    body(doc, data.coordinatorRemarks || 'N/A');

    heading(doc, 'HOD Remarks:');
    body(doc, data.hodRemarks || 'N/A');

    signatureRow(doc, 'TNP Coordinator', 'Department HOD');

    doc.end();
});

module.exports = {
    generateDriveReportPdf,
    generateSessionReportPdf,
    generateManagementReportPdf,
};
