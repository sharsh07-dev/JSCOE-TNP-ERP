'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Settings, User, Lock, Loader2, Save, Info, Server, Key, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
    const { user, logout } = useAuthStore();
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            toast.success('Password updated in institutional registry');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to update synthesis credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 font-sans">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                    <Settings size={28} className="text-blue-600" /> Account Settings
                </h1>
                <p className="text-[15px] font-medium text-slate-500 mt-1">Manage personnel profile and secure access credentials.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Profile & System */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Profile Info */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center">
                        <div className="relative inline-block mb-6">
                            <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-600/20">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white shadow-sm">
                                <ShieldCheck size={14} />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{user?.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4">{user?.email}</p>
                        <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-[0.15em] rounded-full border border-blue-100">
                            {user?.role} Access
                        </span>

                        <div className="mt-8 space-y-3">
                            {[
                                { label: 'Department', value: user?.department || '—' },
                                { label: 'Institution', value: user?.college || 'JSCOE' },
                            ].map(({ label, value }) => (
                                <div key={label} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                    <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-widest">{label}</p>
                                    <p className="text-[13px] font-extrabold text-slate-700 truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>


                </div>

                {/* Right Column - Security Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Change Password */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <div className="flex flex-col mb-8">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Key size={20} className="text-blue-600" /> Security Synchronization
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Update Registry Credentials</p>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                                <input
                                    type="password"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder-slate-300"
                                    placeholder="Enter active credential"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder-slate-300"
                                        placeholder="Min. 6 chars"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Verify Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder-slate-300"
                                        placeholder="Repeat new password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {loading ? (
                                        <><Loader2 size={18} className="animate-spin" /> Verifying Credentials...</>
                                    ) : (
                                        <><Save size={18} /> Sync Account Credentials</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security Info Card */}
                    <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 flex items-start gap-5">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                            <Info size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-bold text-blue-900 mb-1 leading-tight">Registry Protocol Advisory</h3>
                            <p className="text-[13px] font-medium text-blue-800/70 leading-relaxed">
                                Personnel access is logged via institutional synthesis protocols. Ensure your credentials meet the JSCOE complexity requirements. For identity revocation or record changes, contact the System Administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
