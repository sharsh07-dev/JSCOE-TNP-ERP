import { create } from 'zustand';
import { authAPI } from '@/lib/api';

interface User {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'coordinator' | 'viewer';
    department?: string;
    college?: string;
    isActive: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    setAuth: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,

    setAuth: (user, token) => {
        localStorage.setItem('tnp_token', token);
        localStorage.setItem('tnp_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    login: async (email, password) => {
        const res = await authAPI.login({ email, password });
        const { token, user } = res.data;
        localStorage.setItem('tnp_token', token);
        localStorage.setItem('tnp_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('tnp_token');
        localStorage.removeItem('tnp_user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadUser: async () => {
        try {
            const token = localStorage.getItem('tnp_token');
            if (!token) {
                set({ isLoading: false });
                return;
            }
            const res = await authAPI.getMe();
            set({ user: res.data, token, isAuthenticated: true, isLoading: false });
        } catch {
            localStorage.removeItem('tnp_token');
            set({ isLoading: false, isAuthenticated: false });
        }
    },
}));

interface ReportState {
    reports: any[];
    currentReport: any | null;
    isGenerating: boolean;
    dashboardStats: any | null;
    setReports: (r: any[]) => void;
    setCurrentReport: (r: any) => void;
    setGenerating: (v: boolean) => void;
    setDashboardStats: (s: any) => void;
}

export const useReportStore = create<ReportState>((set) => ({
    reports: [],
    currentReport: null,
    isGenerating: false,
    dashboardStats: null,
    setReports: (reports) => set({ reports }),
    setCurrentReport: (currentReport) => set({ currentReport }),
    setGenerating: (isGenerating) => set({ isGenerating }),
    setDashboardStats: (dashboardStats) => set({ dashboardStats }),
}));
