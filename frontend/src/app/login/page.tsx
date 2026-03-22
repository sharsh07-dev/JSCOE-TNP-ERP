'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, Award, Heart, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(credentials.email, credentials.password);
            toast.success('Access Granted: Welcome to the TNP Cell');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Authorization Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans overflow-x-hidden">

            {/* ── Institutional Header ─────────────────── */}
            <header className="w-full bg-white shadow-md flex-shrink-0">
                <img
                    src="/header.png"
                    className="w-full h-auto max-h-[90px] object-fill"
                    alt="JSCOE Institutional Header"
                />
            </header>

            {/* ── Main Body ────────────────────────────── */}
            <div className="flex-1 relative flex items-center justify-center py-10 px-4 lg:px-12">

                {/* Background */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-fixed"
                    style={{ backgroundImage: "url('/background.jpg')" }}
                >
                    <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-[1px]" />
                </div>

                {/* 3-column grid */}
                <div className="relative z-10 w-full max-w-[1380px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                    {/* ── COL 1: Photo ─────────────────── */}
                    <div className="hidden lg:flex lg:col-span-3 flex-col items-center justify-center">
                        <div className="bg-white p-3 rounded-2xl shadow-2xl w-full max-w-[260px]">
                            <div className="aspect-[4/5] rounded-xl overflow-hidden">
                                <img
                                    src="/students.jpg"
                                    className="w-full h-full object-cover object-center"
                                    alt="JSCOE Students"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── COL 2: Branding ──────────────── */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* Title */}
                        <div>
                            <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                                JSPM -{' '}
                                <span className="text-blue-400">TNP CELL</span>
                                <br />@ JSCOE
                            </h1>
                            <p className="text-[15px] font-bold text-blue-400 mt-3">
                                (Training &amp; Placement Cell — JSPM&apos;s JSCOE)
                            </p>
                            <p className="text-[14px] text-slate-300 mt-4 leading-relaxed">
                                A centralized platform to manage students, teachers,
                                academics, and administration—designed to simplify
                                college operations and improve communication across JSPM.
                            </p>
                        </div>

                        {/* Feature cards */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-4 p-4 bg-white/8 border border-white/10 rounded-2xl hover:bg-white/12 transition-all">
                                <div className="w-9 h-9 mt-0.5 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-bold text-white">Student Management</h4>
                                    <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">
                                        Track attendance, results, profiles, and academic progress in real time.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-white/8 border border-white/10 rounded-2xl hover:bg-white/12 transition-all">
                                <div className="w-9 h-9 mt-0.5 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Award size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-bold text-white">Faculty &amp; Admin Control</h4>
                                    <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">
                                        Manage teachers, subjects, schedules, notices, and internal workflows securely.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info bar */}
                        <div className="bg-slate-800/70 border border-white/10 rounded-xl px-5 py-3 text-[12px] text-slate-400 text-center">
                            This system is developed and maintained by our dedicated contributors and technical team.
                        </div>

                        {/* Contributors button */}
                        <Link
                            href="/contributors"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800/70 border border-white/10 rounded-xl text-[13px] font-bold text-white hover:bg-slate-700/80 hover:border-white/20 transition-all"
                        >
                            <Heart size={14} className="text-red-400" />
                            Contributors
                        </Link>
                    </div>

                    {/* ── COL 3: Login Card ────────────── */}
                    <div className="lg:col-span-4 flex justify-center lg:justify-end">
                        <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 lg:p-10 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)]">

                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900">Welcome back</h2>
                                <p className="text-[12px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">
                                    Sign in to continue
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        Username
                                    </label>
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={credentials.email}
                                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-300"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="login-password"
                                            type={showPassword ? "text" : "password"}
                                            value={credentials.password}
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-12 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-300"
                                            placeholder="Enter your password"
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none flex items-center justify-center p-1"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-1">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <label htmlFor="remember" className="text-[13px] text-slate-500 cursor-pointer">
                                        Remember me for 30 days
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                                </button>
                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-slate-100"></div>
                                    <span className="flex-shrink-0 mx-4 text-slate-400 text-[11px] font-bold uppercase">Or</span>
                                    <div className="flex-grow border-t border-slate-100"></div>
                                </div>

                                <Link
                                    href="/signup"
                                    className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-bold text-[15px] py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    Sign Up New Account
                                </Link>
                            </form>

                            <div className="mt-6 text-center">
                                <Link href="/forgot-password" className="block text-[13px] font-semibold text-blue-600 hover:underline">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
