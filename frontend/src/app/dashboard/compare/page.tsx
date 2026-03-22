'use client';
import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, GitCompare, Building2, PlusCircle, Trash2, ChevronRight, CheckCircle, BarChart3 } from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    CartesianGrid,
} from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

export default function ComparePage() {
    const [reports, setReports] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [comparison, setComparison] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        reportsAPI.getAll({ type: 'drive' })
            .then((r) => setReports(r.data))
            .finally(() => setFetching(false));
    }, []);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 5 ? [...prev, id] : prev
        );
    };

    const handleCompare = async () => {
        if (selectedIds.length < 2) {
            toast.error('Select at least 2 drive reports to compare side-by-side');
            return;
        }
        setLoading(true);
        try {
            const res = await reportsAPI.compareDrives(selectedIds);
            setComparison(res.data);
            window.scrollTo({ top: 400, behavior: 'smooth' });
        } catch {
            toast.error('Synthesis comparison failed. Check report data integrity.');
        } finally {
            setLoading(false);
        }
    };

    const barData = comparison?.map((c) => ({
        company: c.company?.slice(0, 15),
        Registered: c.totalRegistered,
        Selected: c.totalSelected,
        'KPI Score (%)': c.kpiScore,
    })) || [];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 font-sans">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    <GitCompare size={28} className="text-blue-600" />
                    Comparative Analysis
                </h1>
                <p className="text-[15px] font-medium text-slate-500 mt-1">
                    Select 2–5 recruitment drives to perform side-by-side performance benchmarking.
                </p>
            </div>

            {/* Selection Grid (PRISM Style) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-[15px] font-extrabold text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                            Select Drive Payload
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Database Inventory</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                        <span className="text-xs font-bold text-slate-500 tracking-tight">{selectedIds.length} of 5 Drives Selected</span>
                    </div>
                </div>

                {fetching ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 size={24} className="animate-spin text-blue-600" />
                        <p className="text-xs font-bold text-slate-400">Loading Registry Records...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-500">No drive reports available for comparison.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {reports.map((r) => {
                            const isSelected = selectedIds.includes(r.id);
                            const selectionIndex = selectedIds.indexOf(r.id) + 1;
                            return (
                                <button
                                    key={r.id}
                                    onClick={() => toggleSelect(r.id)}
                                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${isSelected
                                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                        }`}>
                                        {isSelected ? (
                                            <span className="text-[14px] font-extrabold">{selectionIndex}</span>
                                        ) : (
                                            <Building2 size={18} />
                                        )}
                                    </div>
                                    <div className="min-w-0 pr-6">
                                        <p className="text-[13px] font-extrabold text-slate-800 truncate leading-tight">{r.companyName || r.title}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{r.createdAt?.slice(0, 10)}</p>
                                    </div>
                                    {isSelected && <CheckCircle size={16} className="absolute top-4 right-4 text-blue-600" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleCompare}
                        disabled={selectedIds.length < 2 || loading}
                        className={`font-bold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg ${selectedIds.length < 2
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                            }`}
                    >
                        {loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Synthesizing Comparison...</>
                        ) : (
                            <><GitCompare size={18} /> Process {selectedIds.length} Reports</>
                        )}
                    </button>
                </div>
            </div>

            {/* Comparison Results */}
            {comparison && (
                <div className="space-y-8 animate-fade-in pt-4">
                    {/* Performance Scorecards */}
                    <div className="flex flex-col mb-4">
                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Performance Benchmarking</h2>
                        <p className="text-[13px] font-medium text-slate-500">Direct statistical collision metrics</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {comparison.map((c, idx) => (
                            <div key={c.id} className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1" style={{ background: COLORS[idx % COLORS.length] }}></div>
                                <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center font-bold text-lg" style={{ background: COLORS[idx % COLORS.length] + '15', color: COLORS[idx % COLORS.length] }}>
                                    {idx + 1}
                                </div>
                                <h3 className="text-[14px] font-extrabold text-slate-800 mb-4 truncate pr-2">{c.company || `Drive ${idx + 1}`}</h3>
                                <div className="space-y-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sourcing</span>
                                        <span className="text-[14px] font-extrabold text-slate-700">{c.totalRegistered} Registered</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Output</span>
                                        <span className="text-[14px] font-extrabold" style={{ color: COLORS[idx % COLORS.length] }}>{c.totalSelected} Hires</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KPI Efficiency</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[16px] font-extrabold ${c.kpiScore >= 70 ? 'text-emerald-500' :
                                                    c.kpiScore >= 40 ? 'text-amber-500' : 'text-red-500'
                                                }`}>
                                                {c.kpiScore}%
                                            </span>
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${c.kpiScore >= 70 ? 'bg-emerald-400' :
                                                            c.kpiScore >= 40 ? 'bg-amber-400' : 'bg-red-400'
                                                        }`}
                                                    style={{ width: `${Math.min(100, c.kpiScore || 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                            {c.kpiScore >= 70 ? 'Good' : c.kpiScore >= 40 ? 'Average' : 'Needs Improvement'}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-50 flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compensation</span>
                                        <span className="text-[12px] font-bold text-slate-600 truncate">{c.ctcOffered || 'No Data'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comparative Visual Analytics */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                        <div className="flex flex-col mb-8">
                            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                                <BarChart3 size={18} className="text-blue-600" /> Statistical Comparison Graph
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Metric Comparison</p>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="company"
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 12,
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            fontWeight: 700
                                        }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                    <Bar dataKey="Registered" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                                    <Bar dataKey="Selected" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                    <Bar dataKey="Score" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
