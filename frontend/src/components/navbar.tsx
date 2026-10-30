'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { Logo } from './ui';

const LINKS = [
  { href: '/registro', label: 'Registrar', icon: '✏️' },
  { href: '/historico', label: 'Histórico', icon: '📅' },
  { href: '/painel', label: 'Painel', icon: '📊' },
  { href: '/feedback', label: 'Avaliar', icon: '💬' },
  { href: '/conta', label: 'Conta', icon: '👤' },
];

const ADMIN_LINKS = [{ href: '/resultados', label: 'Resultados', icon: '📋' }];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Logo href="/registro" />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">Olá, {user?.name.split(' ')[0]}</span>
          <button onClick={handleLogout} className="btn-secondary px-3 py-1.5">
            Sair
          </button>
        </div>
      </div>
      <nav aria-label="Navegação principal" className="mx-auto max-w-5xl px-2 sm:px-4">
        <ul className="flex gap-1 overflow-x-auto">
          {[...LINKS, ...(user?.isAdmin ? ADMIN_LINKS : [])].map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                    active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span aria-hidden>{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
