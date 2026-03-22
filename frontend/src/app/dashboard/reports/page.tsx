'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
    FileText, Search, Filter, Trash2, Download, Eye,
    Building2, Users, BarChart3, PlusCircle, Loader2, ChevronRight, MoreVertical
} from 'lucide-react';

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
    drive: { label: 'Campus Drive', color: 'badge-blue', icon: Building2 },
    session: { label: 'Session', color: 'badge-purple', icon: Users },
    management: { label: 'Management', color: 'badge-green', icon: BarChart3 },
};

export default function ReportsListPage() {
    const { user } = useAuthStore();
    const [reports, setReports] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await reportsAPI.getAll({ type: typeFilter || undefined });
            setReports(res.data);
            setFiltered(res.data);
        } catch {
            toast.error('Failed to load reportsRegistry');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, [typeFilter]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            reports.filter(
                (r) =>
                    r.title?.toLowerCase().includes(q) ||
                    r.companyName?.toLowerCase().includes(q) ||
                    r.type?.toLowerCase().includes(q)
            )
        );
    }, [search, reports]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
        setDeleting(id);
        try {
            await reportsAPI.delete(id);
            toast.success('Report removed from registry');
            setReports((prev) => prev.filter((r) => r.id !== id));
        } catch {
            toast.error('Failed to delete report');
        } finally {
            setDeleting(null);
        }
    };

    const handleDownloadDocx = async (id: string, title: string) => {
        setDownloading(id);
        try {
            const res = await reportsAPI.exportDocx(id);
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.docx`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Generated DOCX downloaded!');
        } catch {
            toast.error('Export failed');
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 font-sans">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        Report Registry
                    </h1>
                    <p className="text-[15px] font-medium text-slate-500 mt-1">
                        Archived organizational records and synthesized document history.
                    </p>
                </div>
                {(user?.role === 'admin' || user?.role === 'coordinator') && (
                    <Link href="/dashboard/generate" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                        <PlusCircle size={18} /> Generate New
                    </Link>
                )}
            </div>

            {/* Filter Suite (Criteria Style) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[14px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Filter by company, report title, or batch..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="lg:w-64 relative group">
                    <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-8 py-3 text-[14px] font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">All Document Types</option>
                        <option value="drive">Campus Drive Reports</option>
                        <option value="session">Training Session Reports</option>
                        <option value="management">Board Summary Reports</option>
                    </select>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 size={32} className="animate-spin text-blue-600" />
                        <p className="text-sm font-bold text-slate-500">Syncing Registry Records...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <FileText size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No archived documents found</h3>
                        <p className="text-[14px] font-medium text-slate-500 mt-1 max-w-sm">No reports match your current filter criteria or the database is empty.</p>
                        <Link href="/dashboard/generate" className="mt-6 text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1.5 transition-colors">
                            Start Generating Reports <ChevronRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Document Title & Details</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Classification</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Author</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Creation Date</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((report) => {
                                    const meta = TYPE_META[report.type] || TYPE_META.drive;
                                    const Icon = meta.icon;
                                    return (
                                        <tr
                                            key={report.id}
                                            className="group hover:bg-slate-50/60 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:border-blue-200 transition-colors">
                                                        <Icon size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/dashboard/reports/${report.id}`}
                                                            className="text-[15px] font-extrabold text-slate-800 hover:text-blue-600 transition-colors truncate block"
                                                        >
                                                            {report.title || report.companyName || 'Untitled Report'}
                                                        </Link>
                                                        <p className="text-[12px] font-medium text-slate-500 truncate mt-0.5">{report.companyName || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`badge ${meta.color} font-bold`}>{meta.label}</span>
                                            </td>
                                            <td className="px-6 py-6 hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-bold flex items-center justify-center text-slate-500 border border-slate-200">
                                                        {report.creatorName?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="text-[13px] font-bold text-slate-600">{report.creatorName || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 hidden lg:table-cell text-slate-500">
                                                <span className="text-[13px] font-medium">{report.createdAt ? format(new Date(report.createdAt), 'dd MMM yyyy') : '—'}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/dashboard/reports/${report.id}`}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                        title="View Analytics"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDownloadDocx(report.id, report.title || 'report')}
                                                        disabled={downloading === report.id}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50"
                                                        title="Download DOCX"
                                                    >
                                                        {downloading === report.id ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <Download size={18} />
                                                        )}
                                                    </button>
                                                    {(user?.role === 'admin' || report.createdBy === user?.uid) && (
                                                        <button
                                                            onClick={() => handleDelete(report.id)}
                                                            disabled={deleting === report.id}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50"
                                                            title="Delete Permanently"
                                                        >
                                                            {deleting === report.id ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={18} />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
