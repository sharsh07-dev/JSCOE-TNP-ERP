'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reportsAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
    Download, ArrowLeft, Building2, Users, BarChart3, Loader2,
    Sparkles, Award, ChevronDown, ChevronUp, Edit3, Save, X,
    Calendar, MapPin, Briefcase, Info, AlertCircle, CheckCircle,
    FileText, Send, Bot, User, RotateCcw, Zap
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];

const SUGGESTED_QUESTIONS = [
    'How many students were placed this year?',
    'Which company selected the most students?',
    'What is the overall placement rate?',
    'Compare attendance across branches',
    'What is the average KPI score?',
    'List all companies that visited campus',
];

interface Message {
    role: 'user' | 'ai';
    text: string;
    time: string;
}

function AIChatPanel({ reportId }: { reportId: string }) {
    const [messages, setMessages] = useState<Message[]>([{
        role: 'ai',
        text: "👋 Hi! I'm your T&P AI Assistant. I have access to your live placement database. Ask me anything — placement stats, company analysis, student attendance trends, KPI scores, and more!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const send = useCallback(async (question: string) => {
        const q = question.trim();
        if (!q || loading) return;
        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { role: 'user', text: q, time: ts }]);
        setInput('');
        setLoading(true);
        try {
            const res = await reportsAPI.aiChat(q, reportId);
            const aiTs = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setMessages(prev => [...prev, { role: 'ai', text: res.data.answer, time: aiTs }]);
        } catch (err: any) {
            console.error('🔥 AI Chat API Failed:', err.response?.data || err.message || err);
            const aiTs = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setMessages(prev => [...prev, {
                role: 'ai',
                text: '⚠️ Sorry, I encountered an error while analyzing the data. Please try again.',
                time: aiTs,
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }, [loading, reportId]);

    const reset = () => setMessages([{
        role: 'ai',
        text: "👋 Hi! I'm your T&P AI Assistant. I have access to your live placement database. Ask me anything!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);

    return (
        <div className="bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl border border-slate-800">
            {/* Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-blue-900/60 via-slate-800/80 to-slate-900 border-b border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Bot size={20} className="text-white" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-[15px] tracking-tight">T&P AI Assistant</h2>
                        <p className="text-blue-400 text-[11px] font-semibold flex items-center gap-1">
                            <Zap size={10} className="fill-current" />
                            Powered by Gemini · Live database access
                        </p>
                    </div>
                </div>
                <button onClick={reset} title="Clear chat"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Suggested chips — only when fresh */}
            {messages.length === 1 && (
                <div className="px-5 pt-4 pb-2 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button key={i} onClick={() => send(q)}
                            className="text-[11px] font-semibold text-blue-300 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/60 px-3 py-1.5 rounded-full transition-all">
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className="px-5 py-4 max-h-[420px] overflow-y-auto space-y-4 scroll-smooth"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow ${m.role === 'ai'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            : 'bg-gradient-to-br from-slate-600 to-slate-700'
                            }`}>
                            {m.role === 'ai' ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
                        </div>
                        {/* Bubble */}
                        <div className={`max-w-[80%] group ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className={`px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap ${m.role === 'ai'
                                ? 'bg-slate-800 text-slate-100 border border-slate-700/50 rounded-tl-sm'
                                : 'bg-blue-600 text-white rounded-tr-sm'
                                }`}>
                                {m.text}
                            </div>
                            <span className="text-[10px] text-slate-500 px-1">{m.time}</span>
                        </div>
                    </div>
                ))}

                {/* Loading dots */}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                            {[0, 1, 2].map(d => (
                                <span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                                    style={{ animationDelay: `${d * 0.18}s` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 pb-5 pt-2 border-t border-slate-800">
                <form onSubmit={(e) => { e.preventDefault(); send(input); }}
                    className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 focus-within:border-blue-500/70 transition-colors">
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about placements, companies, students…"
                        disabled={loading}
                        className="flex-1 bg-transparent text-white text-[13.5px] placeholder:text-slate-500 outline-none"
                    />
                    <button type="submit" disabled={loading || !input.trim()}
                        className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0">
                        <Send size={14} className="text-white" />
                    </button>
                </form>
            </div>
        </div>
    );
}

const Section = ({
    title, children, defaultOpen = true, icon: Icon
}: { title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: any }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full p-6 text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
            >
                <div className="flex items-center gap-3">
                    {Icon && <div className="p-2 bg-slate-100 rounded-lg"><Icon size={18} className="text-slate-500" /></div>}
                    <h2 className="text-[15px] font-extrabold text-slate-800 tracking-wide uppercase">{title}</h2>
                </div>
                {open ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            {open && <div className="p-4 sm:p-8 animate-fade-in">{children}</div>}
        </div>
    );
};

const LV = ({ label, value }: { label: string; value: any }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-4 border-b border-slate-50 last:border-0 group">
        <span className="text-slate-400 text-[12px] font-bold uppercase tracking-widest min-w-[220px] pt-0.5">{label}</span>
        <span className="text-slate-800 text-[15px] font-extrabold group-hover:text-blue-600 transition-colors leading-relaxed">{value || 'N/A'}</span>
    </div>
);

export function ReportDetailContent() {
    const { reportId } = useParams() as { reportId: string };
    const router = useRouter();
    const { user } = useAuthStore();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        reportsAPI.getOne(reportId)
            .then((r) => setReport(r.data))
            .catch(() => toast.error('Failed to load report registry'))
            .finally(() => setLoading(false));
    }, [reportId]);

    const handleDownloadDocx = async () => {
        setDownloading(true);
        try {
            const res = await reportsAPI.exportDocx(reportId);
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(report?.title || 'report').replace(/[^a-z0-9]/gi, '_')}.docx`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Professional DOCX generated and downloaded!');
        } catch {
            toast.error('Synthesis export failed');
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            // Call the backend which generates the PDF in the exact institutional template format
            const res = await reportsAPI.exportPdf(reportId);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(report?.title || 'report').replace(/[^a-z0-9]/gi, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Institutional PDF downloaded successfully!');
        } catch (err) {
            console.error(err);
            toast.error('PDF export failed');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <p className="text-slate-500 font-bold tracking-tight">Synthesizing Registry Data...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="text-center py-24 text-slate-500 flex flex-col items-center gap-4">
                <AlertCircle size={48} className="text-slate-300" />
                <h3 className="text-xl font-bold">Report Registry Missing</h3>
                <button onClick={() => router.back()} className="bg-slate-100 px-6 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition-all">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const d = report.structuredData;
    const branchAttendanceData = d?.attendanceData?.branchWise?.map((b: any) => ({
        branch: b.branch || '',
        Attended: b.attended || 0,
        Registered: b.registered || 0,
    })) || [];

    const selectionPieData = [
        { name: 'Selected', value: d?.selectionResults?.totalSelected || 0 },
        { name: 'Not Selected', value: Math.max(0, (d?.attendanceData?.totalAttended || 0) - (d?.selectionResults?.totalSelected || 0)) },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 font-sans">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 pb-6 sm:pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4 sm:gap-5">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 border border-slate-200 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{report.title || 'Institutional Report'}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Author: {report.creatorName}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span>ID: {reportId.slice(0, 8)}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span>{report.createdAt ? format(new Date(report.createdAt), 'dd MMM yyyy') : ''}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <button
                        onClick={handleDownloadDocx}
                        disabled={downloading}
                        className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        {downloading ? (
                            <><Loader2 size={16} className="animate-spin" /> ...</>
                        ) : (
                            <><FileText size={16} /> DOCX</>
                        )}
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        {downloading ? (
                            <><Loader2 size={16} className="animate-spin" /> ...</>
                        ) : (
                            <><Download size={16} /> PDF</>
                        )}
                    </button>
                </div>
            </div>

            <div id="report-pdf-content" className="bg-white p-2">

                {/* KPI Performance Card (ERP PRISM Highlight) */}
                {report.type === 'drive' && d?.kpiScore && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Award size={120} className="text-amber-900" />
                        </div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-amber-400 text-white rounded-xl shadow-md">
                                <Award size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-amber-900 leading-none">PERFORMANCE BENCHMARK</h2>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">Registry Analysis Score</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 relative z-10">
                            <div className="col-span-2 sm:col-span-1 border-b-2 sm:border-b-0 sm:border-r-2 border-amber-200/50 pb-4 sm:pb-0 sm:pr-4">
                                {/* Score — always 0-100 % */}
                                <div className="flex items-end gap-1 leading-none">
                                    <span className="text-[44px] sm:text-[56px] font-black text-amber-900 leading-none">
                                        {Math.min(100, Math.round(d.kpiScore.overallScore || 0))}
                                    </span>
                                    <span className="text-[20px] sm:text-[24px] text-amber-600/50 font-bold mb-1 sm:mb-2">%</span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden my-2">
                                    <div
                                        className="h-full bg-amber-500 rounded-full"
                                        style={{ width: `${Math.min(100, d.kpiScore.overallScore || 0)}%` }}
                                    />
                                </div>
                                <div className="mt-2 inline-block px-3 sm:px-4 py-1.5 bg-amber-900 text-white text-[11px] sm:text-sm font-black rounded-lg">
                                    GRADE: {d.kpiScore.grade}
                                </div>
                            </div>
                            {Object.entries(d.kpiScore.breakdown || {}).map(([key, val]: any) => (
                                <div key={key} className="flex flex-col justify-center border-r border-amber-200/30 sm:border-r-0 pr-2 sm:pr-0">
                                    <div className="text-xl sm:text-2xl font-black text-amber-900 leading-none">
                                        {Math.min(100, Math.round(Number(val) || 0))}
                                        <span className="text-[11px] sm:text-sm text-amber-600/50 font-bold ml-0.5">%</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.05em] sm:tracking-widest mt-2">{key.replace(/([A-Z])/g, ' $1')}</div>
                                </div>
                            ))}
                        </div>

                        {d.kpiScore.insights?.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-amber-200/50">
                                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Sparkles size={14} /> Key Insights
                                </p>
                                <div className="grid sm:grid-cols-2 gap-x-12 gap-y-3">
                                    {d.kpiScore.insights.map((ins: string, i: number) => (
                                        <div key={i} className="text-[13px] font-bold text-amber-900/80 flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                            {ins}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Content Sections */}
                <div className="space-y-6">
                    {report.type === 'drive' && (
                        <>
                            <Section title="Institutional Registry Details" icon={Building2}>
                                <div className="grid md:grid-cols-2 gap-x-12">
                                    <LV label="Legal Entity Name" value={d?.companyDetails?.companyName} />
                                    <LV label="Industrial Sector" value={d?.companyDetails?.industrySector} />
                                    <LV label="Calendar Date" value={d?.companyDetails?.driveDate} />
                                    <LV label="Designated Venue" value={d?.companyDetails?.driveVenue} />
                                    <LV label="Execution Mode" value={d?.companyDetails?.driveMode} />
                                    <LV label="Official Liaison" value={d?.companyDetails?.contactPerson} />
                                    <LV label="Liaison Communication" value={d?.companyDetails?.contactEmail} />
                                </div>
                            </Section>

                            <Section title="Compensation & Role Structure" icon={Briefcase}>
                                <div className="grid md:grid-cols-2 gap-x-12">
                                    <LV label="Professional Designation" value={d?.jobDetails?.jobRole} />
                                    <LV label="Annual Renumeration (CTC)" value={d?.jobDetails?.ctcOffered} />
                                    <LV label="Base Operations Center" value={d?.jobDetails?.location} />
                                    <LV label="Contractual Bond" value={d?.jobDetails?.bond} />
                                    <LV label="Deployment Timeline" value={d?.jobDetails?.joiningDate} />
                                </div>
                                <div className="mt-8 space-y-6">
                                    {d?.jobDetails?.jobDescription && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Core Responsibilities</p>
                                            <p className="text-[15px] font-medium text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">{d.jobDetails.jobDescription}</p>
                                        </div>
                                    )}
                                    {d?.jobDetails?.eligibilityCriteria && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Candidate Pre-requisites</p>
                                            <p className="text-[15px] font-medium text-slate-700 leading-relaxed bg-blue-50/50 p-6 rounded-2xl border border-blue-100">{d.jobDetails.eligibilityCriteria}</p>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            <Section title="Statistical Analysis & Attendance" icon={BarChart3}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    {[
                                        { label: 'Total Registered', value: d?.attendanceData?.totalRegistered, color: 'text-blue-600', icon: Users },
                                        { label: 'Physical Attendance', value: d?.attendanceData?.totalAttended, color: 'text-purple-600', icon: Calendar },
                                        { label: 'Final Selections', value: d?.selectionResults?.totalSelected, color: 'text-emerald-600', icon: CheckCircle },
                                    ].map(({ label, value, color, icon: Icon }) => (
                                        <div key={label} className="bg-slate-50 border border-slate-100 p-8 rounded-3xl text-center group hover:bg-white hover:shadow-xl transition-all duration-300">
                                            <div className={`w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform`}>
                                                <Icon size={24} className={color} />
                                            </div>
                                            <div className={`text-[44px] font-black ${color} leading-none mb-2`}>{value || 0}</div>
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid lg:grid-cols-2 gap-12">
                                    {branchAttendanceData.length > 0 && (
                                        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                                            <h3 className="text-[13px] font-bold text-slate-800 mb-8 flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                                                Branch Participation Profile
                                            </h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={branchAttendanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                    <XAxis dataKey="branch" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                                    <ReTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="Registered" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                                    <Bar dataKey="Attended" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                    {selectionPieData.some((d) => d.value > 0) && (
                                        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                                            <h3 className="text-[13px] font-bold text-slate-800 mb-8 flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                                                Final Conversion Yield
                                            </h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={selectionPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                                                        <Cell fill="#10b981" />
                                                        <Cell fill="#f1f5f9" />
                                                    </Pie>
                                                    <ReTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingBottom: 10 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {d?.selectionResults?.selectedStudents?.length > 0 && (
                                <Section title="Deployment Asset Registry" icon={CheckCircle}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100 pb-4">
                                                    {['#', 'Candidate Name', 'Branch', 'Roll Reference', 'Academic CGPA'].map((h) => (
                                                        <th key={h} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-4 pl-4">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {d.selectionResults.selectedStudents.map((s: any, idx: number) => (
                                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-5 text-[13px] font-bold text-slate-300">{idx + 1}</td>
                                                        <td className="px-4 py-5 text-[15px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">{s.name || '—'}</td>
                                                        <td className="px-4 py-5 text-[13px] font-bold text-slate-500 uppercase">{s.branch || '—'}</td>
                                                        <td className="px-4 py-5 font-mono text-[12px] text-slate-400">{s.rollNo || '—'}</td>
                                                        <td className="px-4 py-5">
                                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-100">
                                                                {s.cgpa || '—'} CGPA
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Section>
                            )}
                        </>
                    )}
                </div>

                {/* ── AI ASSISTANT CHAT PANEL ───────────────────────────── */}
                <AIChatPanel reportId={reportId} />

            </div>
        </div>
    );
}
