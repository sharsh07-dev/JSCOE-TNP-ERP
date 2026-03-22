'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Loader2, Lock, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) setError('Invalid or missing reset token. Please request a new link.');
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

        setIsLoading(true);
        try {
            await authAPI.resetPassword(token, newPassword);
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="w-full bg-white shadow-sm">
                <img src="/header.png" className="w-full h-auto max-h-[90px] object-fill" alt="JSCOE Header" />
            </header>

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-[420px]">

                    <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700 mb-8">
                        <ArrowLeft size={15} /> Back to Login
                    </Link>

                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

                        {success ? (
                            /* ── Success State ── */
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle2 size={32} className="text-green-600" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mb-2">Password Reset!</h2>
                                <p className="text-[14px] text-slate-500 leading-relaxed">
                                    Your password has been updated successfully. Redirecting you to login...
                                </p>
                                <div className="mt-5 w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                    <div className="bg-blue-600 h-1 rounded-full animate-[grow_3.5s_linear_forwards]" style={{ width: '100%' }} />
                                </div>
                            </div>
                        ) : !token ? (
                            /* ── Invalid Token State ── */
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <XCircle size={32} className="text-red-500" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mb-2">Invalid Link</h2>
                                <p className="text-[14px] text-slate-500 mb-6">
                                    This password reset link is invalid or has expired.
                                </p>
                                <Link
                                    href="/forgot-password"
                                    className="w-full block text-center py-3 bg-blue-600 text-white font-bold text-[14px] rounded-xl hover:bg-blue-700 transition-all"
                                >
                                    Request a new link
                                </Link>
                            </div>
                        ) : (
                            /* ── Reset Form ── */
                            <>
                                <div className="mb-7">
                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Lock size={22} className="text-blue-600" />
                                    </div>
                                    <h1 className="text-2xl font-black text-slate-900">Set New Password</h1>
                                    <p className="text-[14px] text-slate-500 mt-1.5">
                                        Create a strong password for your TNP ERP account.
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700 font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-300"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat new password"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-300"
                                        />
                                    </div>

                                    {/* Strength hint */}
                                    {newPassword.length > 0 && (
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${newPassword.length >= i * 4
                                                        ? i === 1 ? 'bg-red-400' : i === 2 ? 'bg-yellow-400' : 'bg-green-500'
                                                        : 'bg-slate-200'
                                                    }`} />
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Reset Password'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-blue-600" /></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
