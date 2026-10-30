import Link from 'next/link';
import type { ReactNode } from 'react';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold text-slate-800">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white" aria-hidden>
        ☀️
      </span>
      <span className="text-lg">Humor Diário</span>
    </Link>
  );
}

export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {label}
    </div>
  );
}

export function Alert({ type, children }: { type: 'success' | 'error' | 'info'; children: ReactNode }) {
  const styles = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-brand-200 bg-brand-50 text-brand-800',
  };
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-slate-600">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SupportCard() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Você não está sozinho(a) 💛</p>
      <p className="mt-1">
        Se estiver passando por um momento difícil, converse com alguém de confiança — um familiar, amigo, professor ou a
        orientação da escola. O <strong>CVV (Centro de Valorização da Vida)</strong> atende gratuitamente, 24 horas, pelo
        telefone <strong>188</strong> ou em{' '}
        <a href="https://cvv.org.br" target="_blank" rel="noreferrer" className="font-semibold underline">
          cvv.org.br
        </a>
        . Em caso de emergência, ligue <strong>192 (SAMU)</strong>.
      </p>
    </div>
  );
}
