'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Navbar } from '@/components/navbar';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/auth';

// Layout das páginas autenticadas: redireciona para o login quando não há sessão válida
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) return <Spinner />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Humor Diário é uma ferramenta de autoconhecimento e não substitui acompanhamento profissional. Precisa
        conversar? CVV: 188 (24h, gratuito).
      </footer>
    </div>
  );
}
