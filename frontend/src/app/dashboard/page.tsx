'use client';
import { useEffect, useState } from 'react';
import { useReportStore, useAuthStore } from '@/store';
import { reportsAPI } from '@/lib/api';
import {
    FileText, TrendingUp, Users, Building2, PlusCircle,
    ArrowRight, Clock, ChevronRight, BarChart3, Award, Sparkles, Search, Activity, Calendar, AlertTriangle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

export default function DashboardHome() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [ayFilter, setAyFilter] = useState('all');       // 'all' | '2025-26' | '2024-25'
    const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'mine'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await reportsAPI.getDashboardStats();
                setStats(res.data);
            } catch (err) {
                toast.error('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchStats();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] animate-pulse">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading Dashboard Data...</p>
                </div>
            </div>
        );
    }

    const reportCount = stats?.totalReports || 0;
    const driveCount = stats?.driveReports || 0;
    const sessionCount = stats?.sessionReports || 0;
    const prevCount = Math.max(0, reportCount - 5);
    const percentage = prevCount === 0 ? 100 : ((reportCount - prevCount) / prevCount) * 100;

    const pieData = [
        { name: 'Campus Drives', value: stats?.driveReports || 0 },
        { name: 'Training Sessions', value: stats?.sessionReports || 0 },
        { name: 'Management', value: stats?.managementReports || 0 },
    ].filter(d => d.value > 0);

    // ── Apply quick filters to recent reports ──────────────────────────────
    const filteredRecentReports = (stats?.recentReports || []).filter((r: any) => {
        const ayMatch =
            ayFilter === 'all' ||
            (r.academicYear || r.header?.academicYear || r.title || '').includes(ayFilter);
        const scopeMatch =
            scopeFilter === 'all' || r.createdBy === user?.uid;
        return ayMatch && scopeMatch;
    });

    // ── Filtered stat counts ───────────────────────────────────────────────
    const allReports: any[] = stats?.allReports || [];
    const filteredAll = allReports.filter((r: any) => {
        const ayMatch = ayFilter === 'all' || (r.academicYear || r.header?.academicYear || r.title || '').includes(ayFilter);
        const scopeMatch = scopeFilter === 'all' || r.createdBy === user?.uid;
        return ayMatch && scopeMatch;
    });
    const isFiltering = ayFilter !== 'all' || scopeFilter !== 'all';
    const displayTotal = isFiltering ? filteredAll.length : (stats?.totalReports || 0);
    const displayDrives = isFiltering ? filteredAll.filter((r: any) => r.type === 'drive').length : (stats?.driveReports || 0);
    const displaySessions = isFiltering ? filteredAll.filter((r: any) => r.type === 'session').length : (stats?.sessionReports || 0);

    return (
        <div className="animate-fade-in pb-12 font-sans">
            {/* Page Header Area */}
            <div className="flex flex-col mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Overview</h1>
                <p className="text-[15px] font-medium text-slate-500 mt-1">
                    View your organizational reports, drive statistics, and recent activity records.
                </p>
            </div>

            {/* Quick Filters */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-8 w-full">
                <h3 className="text-base font-bold text-slate-800 mb-1">Quick Filters</h3>
                <p className="text-sm text-slate-500 mb-5">Filter your dashboard metrics by academic year and scope.</p>

                <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Academic Year</label>
                        <select
                            className="bg-white border text-sm font-medium border-slate-300 text-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer appearance-none"
                            value={ayFilter}
                            onChange={e => setAyFilter(e.target.value)}
                        >
                            <option value="all">All Academic Years</option>
                            <option value="2025-26">Year 2025-26 (Current)</option>
                            <option value="2024-25">Year 2024-25</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Report Scope</label>
                        <select
                            className="bg-white border text-sm font-medium border-slate-300 text-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer appearance-none"
                            value={scopeFilter}
                            onChange={e => setScopeFilter(e.target.value)}
                        >
                            <option value="all">All Organizational Reports</option>
                            <option value="mine">My Generated Reports</option>
                        </select>
                    </div>
                </div>

                {/* Active filter badge */}
                {isFiltering && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                            Filtering: {ayFilter !== 'all' ? ayFilter : ''}{ayFilter !== 'all' && scopeFilter !== 'all' ? ' · ' : ''}{scopeFilter === 'mine' ? 'My Reports' : ''}
                        </span>
                        <button
                            onClick={() => { setAyFilter('all'); setScopeFilter('all'); }}
                            className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* 4 Cards Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
                {/* Card 1 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4 text-slate-500">
                        <h3 className="text-[13px] font-bold tracking-wide">Total Reports</h3>
                        <Calendar size={18} className="text-slate-400" />
                    </div>
                    <div>
                        <span className="block text-[32px] font-extrabold text-slate-900 leading-none mb-1">
                            {displayTotal}
                        </span>
                        <div className="text-xs font-bold mt-2 text-slate-500">
                            {isFiltering ? `Filtered results` : 'Entire Database'}
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4 text-slate-500">
                        <h3 className="text-[13px] font-bold tracking-wide">Drive Reports</h3>
                        <Building2 size={18} className="text-slate-400" />
                    </div>
                    <div>
                        <span className="block text-[32px] font-extrabold text-emerald-600 leading-none mb-1">
                            {displayDrives}
                        </span>
                        <div className="text-xs font-bold mt-2 text-slate-500">
                            Campus Placements
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4 text-slate-500">
                        <h3 className="text-[13px] font-bold tracking-wide">Session Reports</h3>
                        <Users size={18} className="text-slate-400" />
                    </div>
                    <div>
                        <span className="block text-[32px] font-extrabold text-red-500 leading-none mb-1">
                            {displaySessions}
                        </span>
                        <div className="text-xs font-bold mt-2 text-slate-500">
                            Trainings & Workshops
                        </div>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4 text-slate-500">
                        <h3 className="text-[13px] font-bold tracking-wide">Percentage Growth</h3>
                        <TrendingUp size={18} className="text-slate-400" />
                    </div>
                    <div>
                        <span className="block text-[32px] font-extrabold text-amber-500 leading-none mb-1">
                            +{percentage.toFixed(1)}%
                        </span>
                        <div className="text-xs font-bold mt-2 text-slate-500">
                            Recent documents
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts & Distribution (2 Columns) */}
            <div className="grid xl:grid-cols-2 gap-8 mb-8">
                {/* Left Column: Line/Bar Chart Box */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col min-h-[420px]">
                    <div className="text-center mb-8">
                        <h2 className="text-lg font-extrabold text-slate-800">Reports Trajectory</h2>
                        <p className="text-[13px] font-medium text-slate-500">Monthly document generations</p>
                    </div>

                    <div className="flex-1 relative w-full h-[280px]">
                        {stats?.reportsByMonth?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.reportsByMonth}>
                                    <XAxis
                                        dataKey="month"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => {
                                            const [year, month] = val.split('-');
                                            const date = new Date(parseInt(year), parseInt(month) - 1);
                                            return date.toLocaleString('default', { month: 'short' });
                                        }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#3b82f6"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <BarChart3 size={40} className="mb-4 text-slate-300" />
                                <p className="font-semibold text-slate-600">No data collected yet</p>
                                <p className="text-sm font-medium mt-1">Start generating reports to populate graphs</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Pie Chart Box */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col min-h-[420px]">
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-extrabold text-slate-800">Report Distribution</h2>
                        <p className="text-[13px] font-medium text-slate-500">Breakdown by report format</p>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center h-[280px]">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: '#334155', fontWeight: 600 }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600, color: '#475569' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center text-center justify-center p-8">
                                <AlertTriangle size={48} className="text-red-400 mb-4 bg-red-50 p-3 rounded-full" />
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Attention Needed</h3>
                                <p className="text-sm text-slate-500 max-w-[250px]">
                                    Your database is completely empty. Please generate new reports to analyze statistics.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Actions & Feed */}
            <div className="grid xl:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 xl:col-span-1">
                    <h2 className="text-[15px] font-extrabold text-slate-800 flex items-center gap-2 mb-6 tracking-wide">
                        Execute Actions
                    </h2>

                    <div className="space-y-3">
                        <Link href="/dashboard/generate?type=drive" className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-100 rounded-xl">
                                    <Building2 size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-[14px]">Campus Drive</h4>
                                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Automate selections</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </Link>

                        <Link href="/dashboard/generate?type=session" className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-purple-100 rounded-xl">
                                    <Users size={20} className="text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-[14px]">Training Session</h4>
                                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Log attendance</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </div>
                </div>

                {/* Live Feed */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 xl:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
                        <div>
                            <h2 className="text-[15px] font-extrabold tracking-wide text-slate-800 flex items-center gap-2">
                                <Activity size={18} className="text-blue-600" />
                                Recently Synced Reports
                            </h2>
                            <p className="text-xs font-semibold text-slate-500 mt-1">Live database tracking feed</p>
                        </div>
                        <Link href="/dashboard/reports" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                            Open Registry <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {filteredRecentReports.length > 0 ? (
                            filteredRecentReports.map((report: any) => (
                                <Link
                                    key={report.id}
                                    href={`/dashboard/reports/${report.id}`}
                                    className="block group bg-slate-50 hover:bg-blue-50/50 border border-slate-200 p-5 rounded-xl transition-all shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                <FileText size={22} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-[15px] group-hover:text-blue-700 transition-colors">
                                                    {report.title}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-500">
                                                    <span>{report.creatorName}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                    <span>{format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${report.type === 'drive' ? 'bg-blue-100 text-blue-700' :
                                                        report.type === 'session' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {report.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all hidden sm:block mt-1" />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-10 px-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                                <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-500 font-semibold mb-1">No reports archived</p>
                                <p className="text-sm font-medium text-slate-400">Your organization's repository holds no records.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
