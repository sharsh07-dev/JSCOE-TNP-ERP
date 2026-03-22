'use client';
import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';
import { BarChart3, Loader2, TrendingUp, PieChart as PieIcon, Activity, Calendar } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
    PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
} from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        reportsAPI.getDashboardStats()
            .then((r) => setStats(r.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <p className="text-slate-500 font-bold">Fetching Analytics Records...</p>
            </div>
        );
    }

    const pieData = [
        { name: 'Drive Reports', value: stats?.driveReports || 0 },
        { name: 'Session Reports', value: stats?.sessionReports || 0 },
        { name: 'Management Reports', value: stats?.managementReports || 0 },
    ].filter(d => d.value > 0);

    const monthlyData = stats?.reportsByMonth || [];

    return (
        <div className="space-y-8 animate-fade-in pb-20 font-sans">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    <BarChart3 size={28} className="text-blue-600" />
                    Institutional Analytics
                </h1>
                <p className="text-[15px] font-medium text-slate-500 mt-1">
                    Visual diagnostic summary of organizational placements and training activity.
                </p>
            </div>

            {/* KPI Row (PRISM Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Registry', value: stats?.totalReports || 0, color: 'text-blue-600', sub: 'Document Count', icon: Activity },
                    { label: 'Campus Drives', value: stats?.driveReports || 0, color: 'text-purple-600', sub: 'Recruitment Ops', icon: TrendingUp },
                    { label: 'Training Sessions', value: stats?.sessionReports || 0, color: 'text-emerald-600', sub: 'Skill Development', icon: Calendar },
                    { label: 'Board Reports', value: stats?.managementReports || 0, color: 'text-amber-600', sub: 'Strategic Summaries', icon: BarChart3 },
                ].map(({ label, value, color, sub, icon: Icon }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-start group hover:border-blue-200 transition-all">
                        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center bg-slate-50 text-slate-400 group-hover:text-blue-500 transition-colors`}>
                            <Icon size={20} />
                        </div>
                        <div className={`text-[32px] font-black ${color} leading-none mb-1`}>{value}</div>
                        <p className="text-[13px] font-extrabold text-slate-700">{label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Monthly Line Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex flex-col mb-8">
                        <h2 className="text-[15px] font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                            <Activity size={16} className="text-blue-600" />
                            Registry Synthesis Trend
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">Monthly Document Generations</p>
                    </div>
                    {monthlyData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyData} margin={{ left: -20, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
                                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={4} dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm font-bold text-slate-400 italic">Historical data not yet synthesized.</p>
                        </div>
                    )}
                </div>

                {/* Distribution Pie */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex flex-col mb-8">
                        <h2 className="text-[15px] font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                            <PieIcon size={16} className="text-purple-600" />
                            Format Identification
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">Classification Breakdown</p>
                    </div>
                    {pieData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 20 }} />
                                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-sm font-bold text-slate-400 italic">No distribution metrics available.</p>
                        </div>
                    )}
                </div>

                {/* Bar chart monthly */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm lg:col-span-2">
                    <div className="flex flex-col mb-8">
                        <h2 className="text-[15px] font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                            <Activity size={16} className="text-emerald-600" />
                            Comparative Monthly Velocity
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">Output Volumetric Distribution</p>
                    </div>
                    {monthlyData.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
                                    <Bar dataKey="count" name="Documents" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 py-10">
                            <p className="text-sm font-bold text-slate-400 italic">Monthly metrics pending registry activity.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
