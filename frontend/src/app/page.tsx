'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser().then(() => {
      const auth = useAuthStore.getState();
      if (auth.isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading TNP ERP...</p>
      </div>
    </div>
  );
}
