'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Lock, Loader2, CheckCircle2, Award, Heart, Building2, UserCircle2, ArrowRight, ShieldCheck, Mail, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: '',
        college: 'JSCOE',
        role: 'coordinator'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authAPI.register(formData);
            toast.success('Registration Initiated: Request Sent for Authorization');
            router.push('/login');
        } catch (err: any) {
            console.error('Registration failed:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Registration Failed';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Top Institutional Header Image */}
            <header className="w-full bg-white z-20 shadow-md">
                <div className="max-w-full mx-auto">
                    <img
                        src="/header.png"
                        className="w-full h-auto max-h-[60px] sm:max-h-[100px] object-contain sm:object-fill"
                        alt="JSCOE Institutional Header"
                    />
                </div>
            </header>

            {/* Main Hero Signup Section */}
            <div className="flex-1 relative flex items-start justify-center pt-12 pb-10 px-6 lg:px-12">
                {/* Background Image with Blur Overlay */}
                <div className="absolute inset-0 opacity-40 z-0 bg-cover bg-center bg-fixed brightness-[0.3]" style={{ backgroundImage: "url('/background.jpg')" }}>
                    <div className="absolute inset-0 bg-slate-950/70 sm:bg-slate-950/60 backdrop-blur-[2px]"></div>
                </div>

                <div className="relative z-10 w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                    {/* Column 1: Photo (Left) */}
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

                    {/* Column 2: Branding & Features (Center) */}
                    <div className="lg:col-span-4 flex flex-col space-y-8 mt-4 lg:mt-8">
                        <div>
                            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter text-white leading-none uppercase">
                                JSPM - <span className="text-blue-500 font-black">PRISM</span>
                            </h2>
                            <p className="text-[13px] font-bold text-blue-400 mt-2 uppercase tracking-wide">
                                (Performance Review & Institutional Success Model)
                            </p>
                            <p className="text-[15px] font-bold text-slate-300 mt-6 leading-relaxed opacity-90">
                                Enroll today to join the elite group of institutional coordinators and automate your operations with our advanced report management system.
                            </p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md group hover:bg-white/10 transition-all">
                                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center text-blue-400 shrink-0">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-black text-white">Institutional Clearance</h4>
                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5 opacity-80">Validation against active personnel directory.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md group hover:bg-white/10 transition-all">
                                <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-black text-white">Full Feature Access</h4>
                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5 opacity-80">Reports, analytics, and drive management.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Signup Card (Right) */}
                    <div className="lg:col-span-5 flex justify-center lg:justify-end mt-4">
                        <div className="w-full max-w-[500px] bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] animate-slide-up relative overflow-hidden group">

                            <div className="text-center mb-6 sm:mb-8">
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">Create ERP Account</h1>
                                <p className="text-[11px] sm:text-[13px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Enroll to continue</p>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
                                        placeholder="Name as per records"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
                                        placeholder="@jscoe.edu.in"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Key</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dept</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 transition-all appearance-none"
                                        required
                                    >
                                        <option value="">Select</option>
                                        <option value="Computer">Computer</option>
                                        <option value="IT">IT</option>
                                        <option value="EnTC">EnTC</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Civil">Civil</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 transition-all appearance-none"
                                        required
                                    >
                                        <option value="coordinator">Coordinator</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="col-span-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-[15px] py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-[13px] font-bold text-slate-400">
                                    Already have a key? <Link href="/login" className="text-blue-600 hover:underline">Sign in to ERP</Link>
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
