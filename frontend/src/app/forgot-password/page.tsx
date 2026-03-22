'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await authAPI.forgotPassword(email);
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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

                        {sent ? (
                            /* ── Success State ── */
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle2 size={32} className="text-green-600" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mb-2">Check your inbox</h2>
                                <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
                                    If <strong className="text-slate-700">{email}</strong> is registered, you&apos;ll receive a password reset link shortly. The link expires in <strong>1 hour</strong>.
                                </p>
                                <p className="text-[12px] text-slate-400 mb-6">
                                    Didn&apos;t receive it? Check your spam folder or try again.
                                </p>
                                <button
                                    onClick={() => { setSent(false); setEmail(''); }}
                                    className="w-full py-3 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Try a different email
                                </button>
                            </div>
                        ) : (
                            /* ── Request Form ── */
                            <>
                                <div className="mb-7">
                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Mail size={22} className="text-blue-600" />
                                    </div>
                                    <h1 className="text-2xl font-black text-slate-900">Forgot Password?</h1>
                                    <p className="text-[14px] text-slate-500 mt-1.5 leading-relaxed">
                                        Enter your registered email address and we&apos;ll send you a link to reset your password.
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
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-300"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
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
