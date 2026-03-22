'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import {
    LayoutDashboard, FileText, PlusCircle, Users, Settings,
    LogOut, Building2, ChevronRight, Menu, Bell, ChevronDown,
    BarChart3, GitCompare, UserCircle, GraduationCap, Trophy, ClipboardList, PenTool, BrainCircuit, Briefcase, FormInput
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['admin', 'coordinator', 'viewer'] },
    { label: 'Generate Report', icon: PlusCircle, href: '/dashboard/generate', roles: ['admin', 'coordinator'] },
    { label: 'All Reports', icon: FileText, href: '/dashboard/reports', roles: ['admin', 'coordinator', 'viewer'] },
    { label: 'Compare Drives', icon: GitCompare, href: '/dashboard/compare', roles: ['admin', 'coordinator'] },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', roles: ['admin', 'coordinator'] },
    { label: 'User Management', icon: Users, href: '/dashboard/users', roles: ['admin'] },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['admin', 'coordinator'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, isAuthenticated, loadUser, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        loadUser().then(() => {
            const state = useAuthStore.getState();
            if (!state.isAuthenticated) {
                router.replace('/login');
            }
        });
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const filteredNav = NAV_ITEMS.filter(
        (item) => user && item.roles.includes(user.role)
    );

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar Overlay (mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Light Theme like JSPM PRISM */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo Section */}
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <Building2 size={22} className="text-white" />
                        </div>
                        <div className="min-w-0 flex flex-col">
                            <h1 className="font-extrabold text-slate-800 text-[15px] tracking-wide leading-tight">JSCOE TNP</h1>
                            <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">{user?.role === 'admin' ? 'ADMINISTRATOR' : 'COORDINATOR'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-thin">
                    <div className="px-3 py-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden">Main Menu</p>
                    </div>
                    {filteredNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-[14px] font-medium group relative ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 transition-colors'} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white absolute right-4"></div>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-5 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <LogOut size={18} className="text-slate-400" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
                {/* Top Header Bar — full-width institutional banner */}
                <header className="relative flex-shrink-0 z-30 shadow-sm" style={{ height: '64px' }}>
                    {/* Banner image — absolutely fills header (no overflow-hidden needed) */}
                    <img
                        src="/insideheader.png"
                        alt="Jayawantrao Sawant College of Engineering, Hadapsar, Pune."
                        className="absolute inset-0 w-full h-full object-cover object-left"
                        style={{ zIndex: 0 }}
                    />
                    {/* Mobile menu button — overlaid top-left */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/90 hover:bg-black/20 transition-colors"
                        style={{ zIndex: 1 }}
                    >
                        <Menu size={22} />
                    </button>
                    {/* Bell + Avatar — overlaid top-right, z-index above image */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3" style={{ zIndex: 1 }}>
                        <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-black/20 transition-colors">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border border-blue-600" />
                        </button>

                        {/* User Avatar */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm ml-2"
                            >
                                {user?.name?.[0]?.toUpperCase()}
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-[200] w-56 animate-fade-in origin-top-right">
                                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                                        <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                                    </div>
                                    <Link
                                        href="/dashboard/settings"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <Settings size={16} className="text-slate-400" /> Account Settings
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative w-full">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
