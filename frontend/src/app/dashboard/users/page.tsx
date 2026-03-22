'use client';
import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';
import { Users, Loader2, Shield, Eye, UserCog, CheckCircle, XCircle, ShieldAlert, BadgeCheck } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
    admin: 'badge-red',
    coordinator: 'badge-blue',
    viewer: 'badge-green',
};

export default function UsersPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        authAPI.getUsers()
            .then((r) => setUsers(r.data))
            .catch(() => toast.error('Failed to load personnel records'))
            .finally(() => setLoading(false));
    }, []);

    const handleUpdate = async (uid: string, updates: any) => {
        setUpdating(uid);
        try {
            await authAPI.updateUser(uid, updates);
            setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, ...updates } : u));
            toast.success('Personnel record updated successfully');
        } catch {
            toast.error('Synthesis update failed');
        } finally {
            setUpdating(null);
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-red-100">
                    <ShieldAlert size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Clearance Required</h2>
                <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs">Personnel management is restricted to Administrative synthesis protocols.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        Personnel Registry
                    </h1>
                    <p className="text-[15px] font-medium text-slate-500 mt-1">Management of authorized TNP Cell coordinators and institutional viewers.</p>
                </div>
                <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Total Inventory:</span>
                    <span className="text-lg font-black text-blue-600">{users.length} Records</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={32} className="animate-spin text-blue-600" />
                        <p className="text-sm font-bold text-slate-500">Syncing Personnel Database...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                    {['Institutional Personnel', 'Registry Role', 'Department', 'Access Status', 'Registry Date', 'Management'].map((h) => (
                                        <th key={h} className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => (
                                    <tr key={u.uid} className="group hover:bg-slate-50/60 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm transition-all group-hover:scale-105 group-hover:border-blue-200 group-hover:shadow-md">
                                                    <span className="text-[15px] font-black">{u.name?.[0]?.toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[15px] font-extrabold text-slate-800 leading-tight">{u.name}</p>
                                                    <p className="text-[12px] font-bold text-slate-400 mt-0.5">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <select
                                                value={u.role}
                                                disabled={u.uid === currentUser?.uid || updating === u.uid}
                                                onChange={(e) => handleUpdate(u.uid, { role: e.target.value })}
                                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[12px] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="viewer">Registry Viewer</option>
                                                <option value="coordinator">Cell Coordinator</option>
                                                <option value="admin">System Administrator</option>
                                            </select>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[13px] font-bold text-slate-600 uppercase tracking-tight">{u.department || 'General Admin'}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'} font-black text-[10px]`}>
                                                {u.isActive ? 'AUTHORIZED' : 'RESTRICTED'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[12px] font-bold text-slate-400 font-mono">{u.createdAt?.slice(0, 10) || '2026-03-19'}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            {u.uid !== currentUser?.uid && (
                                                <button
                                                    onClick={() => handleUpdate(u.uid, { isActive: !u.isActive })}
                                                    disabled={updating === u.uid}
                                                    className={`flex items-center gap-2 text-[11px] font-black px-4 py-2 rounded-xl border-2 transition-all uppercase tracking-widest ${u.isActive
                                                        ? 'border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200'
                                                        : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                                                        } disabled:opacity-50`}
                                                >
                                                    {updating === u.uid ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : u.isActive ? (
                                                        <><XCircle size={14} /> Revoke</>
                                                    ) : (
                                                        <><BadgeCheck size={14} /> Authorize</>
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
