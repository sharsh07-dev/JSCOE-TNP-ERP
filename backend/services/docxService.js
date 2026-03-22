const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    WidthType,
    BorderStyle,
    ShadingType,
    Header,
    Footer,
    PageNumber,
    ImageRun,
    TableLayoutType,
    VerticalAlign,
    HeadingLevel,
    UnderlineType,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// SHARED UTILITIES
// ─────────────────────────────────────────────

const BORDER_SINGLE = { style: BorderStyle.SINGLE, size: 4, color: 'auto' };
const BORDER_NIL = { style: BorderStyle.NONE, size: 0, color: 'auto' };

const calisto = (text, opts = {}) =>
    new TextRun({
        text: text || '',
        font: 'Calisto MT',
        size: opts.size || 22,
        bold: opts.bold || false,
        color: opts.color || '000000',
        underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
        italics: opts.italics || false,
    });

const emptyPara = (spacing = 100) =>
    new Paragraph({ text: '', spacing: { before: spacing, after: 0 } });

/**
 * Build a 3-column summary table exactly matching the DOCX template:
 * Col1 = Sr.No (narrow), Col2 = Field Name, Col3 = Value
 */
const buildSummaryTable = (rows) => {
    const makeCell = (text, bold = false, align = AlignmentType.LEFT, widthDxa = null) => {
        const cell = new TableCell({
            children: [
                new Paragraph({
                    children: [calisto(text, { bold, size: 21 })],
                    alignment: align,
                    spacing: { before: 50, after: 50 },
                }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            borders: {
                top: BORDER_SINGLE,
                bottom: BORDER_SINGLE,
                left: BORDER_SINGLE,
                right: BORDER_SINGLE,
            },
            margins: { top: 60, bottom: 60, left: 108, right: 108 },
        });
        if (widthDxa) cell.width = { size: widthDxa, type: WidthType.DXA };
        return cell;
    };

    return new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 10071, type: WidthType.DXA },
        indent: { size: 113, type: WidthType.DXA },
        rows: rows.map(([srNo, field, value]) =>
            new TableRow({
                height: { value: 754, rule: 'atLeast' },
                children: [
                    makeCell(srNo, true, AlignmentType.CENTER, 1609),
                    makeCell(field, false, AlignmentType.LEFT, 3601),
                    makeCell(value || 'N/A', false, AlignmentType.LEFT, 4861),
                ],
            })
        ),
    });
};

/**
 * Bold centered title in Calisto MT, matching heading style in template
 */
const templateTitle = (text) =>
    new Paragraph({
        children: [calisto(text, { bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 200 },
    });

/**
 * Bold section heading (left-aligned)
 */
const sectionHeading = (text) =>
    new Paragraph({
        children: [calisto(text, { bold: true, size: 22, underline: true })],
        alignment: AlignmentType.LEFT,
        spacing: { before: 300, after: 100 },
    });

/**
 * Regular paragraph in Calisto MT
 */
const bodyPara = (text, opts = {}) =>
    new Paragraph({
        children: [calisto(text || 'N/A', opts)],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 80, after: 80 },
    });

/**
 * Label: Value line
 */
const labelValue = (label, value) =>
    new Paragraph({
        children: [
            calisto(label + ': ', { bold: true, size: 22 }),
            calisto(value || 'N/A', { size: 22 }),
        ],
        spacing: { before: 60, after: 60 },
    });

/**
 * Attempt to load letterhead image from frontend/public/header.png
 */
const getLetterheadImage = () => {
    const possiblePaths = [
        path.join(__dirname, '../../frontend/public/header.png'),
        path.join(__dirname, '../public/header.png'),
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return fs.readFileSync(p);
    }
    return null;
};

/**
 * Build a header paragraph with letterhead image (or text fallback)
 */
const buildLetterhead = () => {
    const imgBuffer = getLetterheadImage();
    if (imgBuffer) {
        return new Paragraph({
            children: [
                new ImageRun({
                    data: imgBuffer,
                    transformation: { width: 540, height: 96 },
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
        });
    }
    // Text fallback if image not found
    return new Paragraph({
        children: [
            calisto('JSPM\'s Jayawantrao Sawant College of Engineering, Pune', { bold: true, size: 26 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
    });
};

/**
 * Embed photo images
 */
const buildPhotoSection = (imagePaths = []) => {
    const result = [sectionHeading('Photos')];
    for (const imgPath of imagePaths) {
        try {
            if (fs.existsSync(imgPath)) {
                const imgBuffer = fs.readFileSync(imgPath);
                result.push(
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: imgBuffer,
                                transformation: { width: 450, height: 338 },
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 },
                    })
                );
            }
        } catch (e) {
            console.log('Could not embed image:', e.message);
        }
    }
    return result;
};

// ─────────────────────────────────────────────
// DRIVE REPORT — matches template exactly
// ─────────────────────────────────────────────
const generateDriveReportDocx = async (data, imagePaths = []) => {
    const c = data.companyDetails || {};
    const j = data.jobDetails || {};
    const att = data.attendanceData || {};
    const sel = data.selectionResults || {};
    const proc = data.selectionProcess || {};
    const ay = data.header?.academicYear || 'N/A';

    // ── Build summary table rows (matching original numbered format) ──
    const summaryRows = [
        ['1', 'Report Type', 'Drive'],
        ['2', 'Company Name', c.companyName],
        ['3', '  Batch', data.header?.batch || c.batch],
        ['4', ' Branch', c.branch || att.branchWise?.map(b => b.branch).join(', ')],
        ['5', ' AY', ay],
        ['6', '  Date and Time', c.driveDate],
        ['7', 'Time', c.driveTime || 'N/A'],
        ['8', ' Registered Student count', String(att.totalRegistered || 0)],
        ['9', 'Attendance', String(att.totalAttended || 0)],
        ['10', 'Shortlisted Student Count', `${sel.totalShortlisted || 0} and ${sel.totalSelected || 0} Selected out of ${sel.totalShortlisted || 0} for final round of Interview`],
        ['11', 'HR Feedback', sel.hrFeedback || 'Awaited'],
    ];

    // ── Build selected students table if available ──
    const selectedStudentsTable = sel.selectedStudents?.length > 0
        ? buildSummaryTable(
            sel.selectedStudents.map((s, i) => [
                String(i + 1),
                s.name || s.rollNo || 'N/A',
                s.branch || 'N/A',
            ])
        )
        : null;

    const children = [
        // Letterhead
        buildLetterhead(),

        // Main title
        templateTitle(`Summary Drive Report - ${ay}`),
        emptyPara(50),

        // ── SECTION 1: Summary Table ──
        buildSummaryTable(summaryRows),
        emptyPara(400),

        // ── SECTION 2: Drive Report narrative ──
        templateTitle(`Drive Report - ${ay}`),
        sectionHeading('Overview:'),
        sectionHeading('Drive Details:'),
        bodyPara(data.driveDetails || data.overviewText ||
            `On ${c.driveDate}, approximately ${sel.totalShortlisted || 0} shortlisted students from the ${c.branch || 'all'} branches of the ${data.header?.batch || ''} batch participated in the final round. The drive began with a pre-talk attended by all ${att.totalRegistered || 0} students. This was followed by an offline Group Discussion, which served as the first round. Out of the ${att.totalAttended || 0} present students, ${sel.totalShortlisted || 0} were selected to advance to the final one-to-one discussion and HR interview round.`
        ),
        emptyPara(100),

        sectionHeading('Selected Students:'),
        bodyPara(data.selectedStudentsText ||
            `In the final round, ${sel.totalSelected || 0} students were selected. Around ${att.totalAttended || 0} students cleared the first round and were called for the HR group discussion round; however, only ${sel.totalSelected || 0} students were ultimately selected by ${c.companyName} in the final round of Interview.`
        ),
        emptyPara(200),

        // ── SECTION 3: Additional Details ──
        labelValue('Company', c.companyName),
        labelValue('Date', c.driveDate),
        labelValue('Time', c.driveTime || 'N/A'),
        labelValue('Venue', c.driveVenue),
        labelValue('AY', ay),
        labelValue('Batch', data.header?.batch || 'N/A'),
        labelValue('Branch', c.branch || 'N/A'),
        labelValue('No criteria', j.eligibilityCriteria || 'No backlogs'),
        labelValue('Total Students attended', String(att.totalAttended || 0)),
        labelValue('Mode', c.driveMode || 'Offline'),
        emptyPara(200),

        // ── SECTION 4: Company Profile ──
        sectionHeading('Company Profile:'),
        bodyPara(data.companyProfile || c.companyProfile || c.companyDescription || 'N/A'),
        emptyPara(200),

        // ── SECTION 5: Selection Rounds ──
        new Paragraph({
            children: [calisto('ROUND 1 – ' + (c.driveMode === 'Online' ? 'On-Line' : 'Off-Line'), { bold: true, size: 22 })],
            spacing: { before: 200, after: 50 },
        }),
        ...(proc.rounds?.length > 0
            ? proc.rounds.map((r, i) =>
                bodyPara(`Round ${i + 1}: ${r}`)
            )
            : [
                bodyPara('Round 1: ' + (proc.round1 || 'Group Discussion')),
                bodyPara('Round 2: ' + (proc.round2 || 'Personal Interview (HR Round)')),
            ]
        ),
        emptyPara(200),

        // ── SECTION 6: Attendance ──
        sectionHeading('Attendance:'),
        bodyPara(`Attendance of ${att.totalAttended || 0} students`),
        emptyPara(200),

        // ── Selected Students table if present ──
        ...(selectedStudentsTable ? [
            sectionHeading('Selected Candidates:'),
            buildSummaryTable(
                [['Sr. No.', 'Student Name', 'Branch']].slice(0) // header hint
            ),
            selectedStudentsTable,
            emptyPara(200),
        ] : []),

        // ── Chart Data Sections (based on selected charts) ──
        ...(() => {
            const charts = data.chartConfig || [];
            const rows = [];

            // Selection Ratio
            if (charts.includes('pie_selection')) {
                const att = data.attendanceData || {};
                const sel = data.selectionResults || {};
                const total = att.totalRegistered || 0;
                const present = att.totalAttended || 0;
                const shortlisted = sel.totalShortlisted || 0;
                const selected = sel.totalSelected || 0;
                const notSelected = Math.max(0, present - selected);
                rows.push(
                    sectionHeading('Selection Ratio Analysis:'),
                    buildSummaryTable([
                        ['1', 'Total Registered', String(total)],
                        ['2', 'Total Attended', String(present)],
                        ['3', 'Shortlisted', String(shortlisted)],
                        ['4', 'Finally Selected', String(selected)],
                        ['5', 'Not Selected', String(notSelected)],
                        ['6', 'Selection Rate', total > 0 ? `${((selected / total) * 100).toFixed(1)}%` : 'N/A'],
                        ['7', 'Attendance Rate', total > 0 ? `${((present / total) * 100).toFixed(1)}%` : 'N/A'],
                    ]),
                    emptyPara(100),
                );
            }

            // Attendance by Branch
            if (charts.includes('bar_attendance')) {
                const branchwise = data.attendanceData?.branchWise || [];
                rows.push(sectionHeading('Attendance by Branch:'));
                if (branchwise.length > 0) {
                    rows.push(
                        buildSummaryTable(
                            branchwise.map((b, i) => [
                                String(i + 1),
                                b.branch || 'N/A',
                                `Registered: ${b.registered || 0}  |  Attended: ${b.attended || 0}`,
                            ])
                        ),
                        emptyPara(100),
                    );
                } else {
                    rows.push(bodyPara('Branch-wise attendance data not available.'), emptyPara(100));
                }
            }

            // Placement Trend
            if (charts.includes('bar_placement')) {
                const att = data.attendanceData || {};
                const sel = data.selectionResults || {};
                rows.push(
                    sectionHeading('Placement Trend:'),
                    buildSummaryTable([
                        ['1', 'Company', data.companyDetails?.companyName || 'N/A'],
                        ['2', 'Drive Date', data.companyDetails?.driveDate || 'N/A'],
                        ['3', 'Total Registered', String(att.totalRegistered || 0)],
                        ['4', 'Total Selected', String(sel.totalSelected || 0)],
                        ['5', 'Overall Placement %', att.totalRegistered > 0 ? `${((sel.totalSelected / att.totalRegistered) * 100).toFixed(1)}%` : 'N/A'],
                    ]),
                    emptyPara(100),
                );
            }

            return rows;
        })(),

        // ── Photos section ──
        ...(imagePaths.length > 0 ? buildPhotoSection(imagePaths) : [
            sectionHeading('Photos'),
            bodyPara('Photss'),
        ]),
    ];

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 0, right: 1440, bottom: 0, left: 1440 },
                },
            },
            children,
        }],
    });

    return await Packer.toBuffer(doc);
};

// ─────────────────────────────────────────────
// SESSION REPORT — template-locked format
// ─────────────────────────────────────────────
const generateSessionReportDocx = async (data, imagePaths = []) => {
    const s = data.sessionDetails || {};
    const sp = data.speakerDetails || {};
    const att = data.attendanceData || {};
    const ay = data.header?.academicYear || 'N/A';

    const summaryRows = [
        ['1', 'Report Type', 'Session'],
        ['2', 'Session Title', s.sessionTitle],
        ['3', 'Topic', s.topic],
        ['4', 'Session Type', s.sessionType],
        ['5', 'Date', s.sessionDate],
        ['6', 'Time', s.sessionTime],
        ['7', 'Duration', s.duration],
        ['8', 'Venue', s.venue],
        ['9', 'Mode', s.mode],
        ['10', 'Total Invited', String(att.totalInvited || 0)],
        ['11', 'Total Attended', String(att.totalAttended || 0)],
        ['12', 'Attendance %', att.attendancePercentage || 'N/A'],
    ];

    const children = [
        buildLetterhead(),
        templateTitle(`Session Report - ${ay}`),
        emptyPara(50),

        buildSummaryTable(summaryRows),
        emptyPara(300),

        sectionHeading('Resource Person Details:'),
        labelValue('Name', sp.name),
        labelValue('Designation', sp.designation),
        labelValue('Organization', sp.organization),
        labelValue('Expertise', sp.expertise),
        emptyPara(100),

        sectionHeading('Overview:'),
        sectionHeading('Session Details:'),
        bodyPara(data.sessionContent?.sessionSummary || data.overviewText || 'N/A'),
        emptyPara(200),

        sectionHeading('Objectives:'),
        ...(data.objectivesAndOutcomes?.objectives || []).map(o =>
            new Paragraph({ children: [calisto('• ' + o, { size: 22 })], spacing: { before: 60, after: 60 } })
        ),
        emptyPara(100),

        sectionHeading('Learning Outcomes:'),
        ...(data.objectivesAndOutcomes?.learningOutcomes || []).map(o =>
            new Paragraph({ children: [calisto('• ' + o, { size: 22 })], spacing: { before: 60, after: 60 } })
        ),
        emptyPara(100),

        sectionHeading('Key Topics Covered:'),
        ...(data.sessionContent?.keyTopicsCovered || []).map(t =>
            new Paragraph({ children: [calisto('• ' + t, { size: 22 })], spacing: { before: 60, after: 60 } })
        ),
        emptyPara(100),

        sectionHeading('Feedback Summary:'),
        labelValue('Overall Rating', data.feedbackSummary?.overallRating),
        labelValue('Content Rating', data.feedbackSummary?.contentRating),
        labelValue('Speaker Rating', data.feedbackSummary?.speakerRating),
        emptyPara(100),

        sectionHeading('Coordinator Remarks:'),
        bodyPara(data.coordinatorRemarks || 'N/A'),
        emptyPara(200),

        sectionHeading('Attendance:'),
        bodyPara(`Attendance of ${att.totalAttended || 0} students`),
        emptyPara(200),

        ...(imagePaths.length > 0 ? buildPhotoSection(imagePaths) : [
            sectionHeading('Photos'),
            bodyPara('(Attach photos here)'),
        ]),
    ];

    const doc = new Document({
        sections: [{
            properties: {
                page: { margin: { top: 0, right: 1440, bottom: 0, left: 1440 } },
            },
            children,
        }],
    });

    return await Packer.toBuffer(doc);
};

// ─────────────────────────────────────────────
// MANAGEMENT / WEEKLY REPORT — template-locked
// ─────────────────────────────────────────────
const generateManagementReportDocx = async (data, imagePaths = []) => {
    const h = data.header || {};
    const ps = data.placementStatistics || {};

    const summaryRows = [
        ['1', 'Report Type', 'Management / Weekly'],
        ['2', 'Report Period', h.reportPeriod],
        ['3', 'Report Date', h.reportDate],
        ['4', 'Submitted To', h.submittedTo],
        ['5', 'Prepared By', h.preparedBy],
        ['6', 'Total Students Placed', String(ps.totalStudentsPlaced || 0)],
        ['7', 'Total Offers', String(ps.totalOffers || 0)],
        ['8', 'New Offers This Week', String(ps.newOffersThisWeek || 0)],
        ['9', 'Companies Visited', String(ps.companiesVisited || 0)],
        ['10', 'Average CTC', ps.averageCTC || 'N/A'],
        ['11', 'Highest CTC', ps.highestCTC || 'N/A'],
    ];

    const children = [
        buildLetterhead(),
        templateTitle(`HOD Weekly Report on T&P — ${h.reportPeriod || 'N/A'}`),
        emptyPara(50),

        buildSummaryTable(summaryRows),
        emptyPara(300),

        sectionHeading('Executive Summary:'),
        bodyPara(data.executiveSummary || 'N/A'),
        emptyPara(200),

        sectionHeading('Campus Drives This Week:'),
        ...(data.weeklyActivities?.drives?.length > 0
            ? data.weeklyActivities.drives.map(d =>
                bodyPara(`• ${d.name || d.title} — ${d.company || ''} | ${d.date || ''} | Students: ${d.students || 0} | Status: ${d.status || 'Completed'}`)
            )
            : [bodyPara('N/A')]
        ),
        emptyPara(100),

        sectionHeading('Training Sessions This Week:'),
        ...(data.weeklyActivities?.sessions?.length > 0
            ? data.weeklyActivities.sessions.map(s =>
                bodyPara(`• ${s.name || s.title} — ${s.speaker || ''} | ${s.date || ''} | Attendance: ${s.attendance || 0}`)
            )
            : [bodyPara('N/A')]
        ),
        emptyPara(100),

        sectionHeading('KPI Metrics:'),
        labelValue('Drive Success Rate', data.kpiMetrics?.driveSuccessRate),
        labelValue('Session Attendance Rate', data.kpiMetrics?.sessionAttendanceRate),
        labelValue('Placement Rate', data.kpiMetrics?.placementRate),
        labelValue('Student Satisfaction', data.kpiMetrics?.studentSatisfactionScore),
        emptyPara(100),

        sectionHeading('Pending Actions:'),
        ...(data.pendingActions?.items || ['N/A']).map(item =>
            bodyPara('• ' + item)
        ),
        emptyPara(100),

        sectionHeading('Next Week Plan:'),
        ...(data.nextWeekPlan?.plannedDrives || []).map(d => bodyPara('Drive: • ' + d)),
        ...(data.nextWeekPlan?.plannedSessions || []).map(s => bodyPara('Session: • ' + s)),
        emptyPara(100),

        sectionHeading('Challenges & Recommendations:'),
        ...(data.challenges || []).map(c => bodyPara('Challenge: • ' + c)),
        ...(data.recommendations || []).map(r => bodyPara('Recommendation: • ' + r)),
        emptyPara(200),

        sectionHeading('Coordinator Remarks:'),
        bodyPara(data.coordinatorRemarks || 'N/A'),
        emptyPara(100),

        sectionHeading('HOD Remarks:'),
        bodyPara(data.hodRemarks || 'N/A'),
        emptyPara(400),

        new Paragraph({
            children: [
                calisto('TNP Coordinator', { bold: true }),
                calisto('\t\t\t\t\t'),
                calisto('Department HOD', { bold: true }),
            ],
            spacing: { before: 200 },
        }),

        ...(imagePaths.length > 0 ? buildPhotoSection(imagePaths) : []),
    ];

    const doc = new Document({
        sections: [{
            properties: {
                page: { margin: { top: 0, right: 1440, bottom: 0, left: 1440 } },
            },
            children,
        }],
    });

    return await Packer.toBuffer(doc);
};

module.exports = {
    generateDriveReportDocx,
    generateSessionReportDocx,
    generateManagementReportDocx,
};
