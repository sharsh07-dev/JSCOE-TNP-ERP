import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_URL = isLocalhost ? 'http://localhost:5000/api' : 'https://jscoe-tnp-erp.onrender.com/api';

console.log('🔗 API Base URL resolved to:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    timeout: 120000, 
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('tnp_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('tnp_token');
                localStorage.removeItem('tnp_user');
                // Only forcefully redirect to login if we aren't already there!
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (data: { email: string; password: string }) => api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    changePassword: (data: any) => api.put('/auth/change-password', data),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
    getUsers: () => api.get('/auth/users'),
    updateUser: (uid: string, data: any) => api.put(`/auth/users/${uid}`, data),
};

// Reports APIs
export const reportsAPI = {
    generate: (formData: FormData) =>
        api.post('/reports/generate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    getAll: (params?: any) => api.get('/reports', { params }),
    getOne: (id: string) => api.get(`/reports/${id}`),
    update: (id: string, data: any) => api.put(`/reports/${id}`, data),
    delete: (id: string) => api.delete(`/reports/${id}`),
    exportDocx: (id: string) => api.get(`/reports/${id}/export/docx`, { responseType: 'blob' }),
    exportPdf: (id: string) => api.get(`/reports/${id}/export/pdf`, { responseType: 'blob' }),
    getDashboardStats: () => api.get('/reports/dashboard/stats'),
    compareDrives: (reportIds: string[]) => api.post('/reports/compare', { reportIds }),
    aiChat: (question: string, reportId?: string) =>
        api.post('/reports/ai-chat', { question, reportId }),
};

export default api;
