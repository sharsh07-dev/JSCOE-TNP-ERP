'use strict';
/**
 * chartRenderer.js
 * Renders Chart.js charts server-side to PNG Buffers using chartjs-node-canvas.
 * Uses chartjs-plugin-datalabels to show values directly on chart elements.
 */

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const ChartDataLabels = require('chartjs-plugin-datalabels');

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
    green: { bg: 'rgba(5,  150, 105, 0.85)', border: 'rgba(5,  150, 105, 1)' },
    blue: { bg: 'rgba(37,  99, 235, 0.85)', border: 'rgba(37,  99, 235, 1)' },
    amber: { bg: 'rgba(217,119,   6, 0.85)', border: 'rgba(217,119,   6, 1)' },
    red: { bg: 'rgba(220, 38,  38, 0.85)', border: 'rgba(220, 38,  38, 1)' },
    purple: { bg: 'rgba(124, 58, 237, 0.85)', border: 'rgba(124, 58, 237, 1)' },
    slate: { bg: 'rgba(148,163, 184, 0.85)', border: 'rgba(148,163, 184, 1)' },
};

// ── Canvas factory (white background, wide) ───────────────────────────────────
const makeCanvas = (w = 750, h = 420) =>
    new ChartJSNodeCanvas({
        width: w, height: h,
        backgroundColour: 'white',
        plugins: { modern: ['chartjs-plugin-datalabels'] },
    });

/**
 * PIE – Selection Ratio
 * Shows each slice with "Label\nN (X%)" text inside/outside.
 */
const renderSelectionPie = async (data) => {
    const att = data.attendanceData || {};
    const sel = data.selectionResults || {};

    const total = att.totalRegistered || 0;
    const attended = att.totalAttended || 0;
    const selected = sel.totalSelected || 0;
    const shortlisted = sel.totalShortlisted || 0;
    const absent = Math.max(0, total - attended);
    const shortNotSel = Math.max(0, shortlisted - selected);
    const attNotShort = Math.max(0, attended - shortlisted);

    const values = [selected, shortNotSel, attNotShort, absent];
    const sum = values.reduce((a, b) => a + b, 0) || 1;
    const pct = (v) => ((v / sum) * 100).toFixed(1);

    const canvas = makeCanvas(750, 420);
    return canvas.renderToBuffer({
        type: 'pie',
        plugins: [ChartDataLabels],
        data: {
            labels: [
                `Selected (${selected})`,
                `Shortlisted – not sel. (${shortNotSel})`,
                `Attended – not short. (${attNotShort})`,
                `Absent (${absent})`,
            ],
            datasets: [{
                data: values,
                backgroundColor: [C.green.bg, C.blue.bg, C.amber.bg, C.slate.bg],
                borderColor: [C.green.border, C.blue.border, C.amber.border, C.slate.border],
                borderWidth: 2,
            }],
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: `Selection Ratio — ${data.companyDetails?.companyName || 'Drive'}`,
                    font: { size: 15, weight: 'bold' },
                    color: '#1e293b',
                    padding: { bottom: 12 },
                },
                legend: {
                    position: 'right',
                    labels: { font: { size: 11 }, color: '#334155', padding: 14 },
                },
                datalabels: {
                    display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0,
                    color: '#fff',
                    font: { size: 12, weight: 'bold' },
                    formatter: (value) => `${value}\n(${pct(value)}%)`,
                    textAlign: 'center',
                },
            },
        },
    });
};

/**
 * BAR – Attendance by Branch
 * Shows count on top of each bar.
 */
const renderAttendanceBar = async (data) => {
    const branchWise = data.attendanceData?.branchWise
        || data.attendanceData?.branchwise
        || data.attendanceData?.branches
        || [];

    const labels = branchWise.length > 0
        ? branchWise.map(b => b.branch || b.branchName || b.name || 'N/A')
        : ['All Branches'];
    const regData = branchWise.length > 0
        ? branchWise.map(b => b.registered ?? b.registeredCount ?? 0)
        : [data.attendanceData?.totalRegistered || 0];
    const attData = branchWise.length > 0
        ? branchWise.map(b => b.attended ?? b.attendedCount ?? 0)
        : [data.attendanceData?.totalAttended || 0];

    const canvas = makeCanvas(750, 420);
    return canvas.renderToBuffer({
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels,
            datasets: [
                {
                    label: 'Registered',
                    data: regData,
                    backgroundColor: C.blue.bg,
                    borderColor: C.blue.border,
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
                {
                    label: 'Attended',
                    data: attData,
                    backgroundColor: C.green.bg,
                    borderColor: C.green.border,
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Attendance by Branch',
                    font: { size: 15, weight: 'bold' },
                    color: '#1e293b',
                    padding: { bottom: 12 },
                },
                legend: {
                    labels: { font: { size: 11 }, color: '#334155' },
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    color: '#1e293b',
                    font: { size: 12, weight: 'bold' },
                    formatter: (v) => v > 0 ? String(v) : '',
                },
            },
            scales: {
                x: {
                    ticks: { color: '#475569', font: { size: 11 } },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#475569', font: { size: 11 }, stepSize: 1 },
                    grid: { color: 'rgba(0,0,0,0.06)' },
                },
            },
        },
    });
};

/**
 * BAR – Placement Trend / Funnel
 * Single grouped bar: Registered → Attended → Shortlisted → Selected
 * Values shown on top of each bar.
 */
const renderPlacementBar = async (data) => {
    const att = data.attendanceData || {};
    const sel = data.selectionResults || {};
    const company = (data.companyDetails?.companyName || 'Drive').slice(0, 24);

    const regVal = att.totalRegistered || 0;
    const attVal = att.totalAttended || 0;
    const shortVal = sel.totalShortlisted || 0;
    const selVal = sel.totalSelected || 0;

    const canvas = makeCanvas(660, 420);
    return canvas.renderToBuffer({
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels: [company],
            datasets: [
                {
                    label: `Registered (${regVal})`,
                    data: [regVal],
                    backgroundColor: C.blue.bg,
                    borderColor: C.blue.border,
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
                {
                    label: `Attended (${attVal})`,
                    data: [attVal],
                    backgroundColor: C.amber.bg,
                    borderColor: C.amber.border,
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
                {
                    label: `Shortlisted (${shortVal})`,
                    data: [shortVal],
                    backgroundColor: C.purple.bg,
                    borderColor: C.purple.border,
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
                {
                    label: `Selected (${selVal})`,
                    data: [selVal],
                    backgroundColor: C.green.bg,
                    borderColor: C.green.border,
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Placement Funnel — Registered → Attended → Shortlisted → Selected',
                    font: { size: 13, weight: 'bold' },
                    color: '#1e293b',
                    padding: { bottom: 12 },
                },
                legend: {
                    labels: { font: { size: 11 }, color: '#334155' },
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    color: '#1e293b',
                    font: { size: 13, weight: 'bold' },
                    formatter: (v) => v > 0 ? String(v) : '',
                },
            },
            scales: {
                x: {
                    ticks: { color: '#475569', font: { size: 11 } },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#475569', font: { size: 11 } },
                    grid: { color: 'rgba(0,0,0,0.06)' },
                },
            },
        },
    });
};

module.exports = { renderSelectionPie, renderAttendanceBar, renderPlacementBar };
