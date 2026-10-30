'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Alert } from '@/components/ui';
import { useAuth } from '@/contexts/auth';
import { api, errorMessage } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import type { Role, User } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'ESTUDANTE' as Role });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace('/registro');
  }, [user, router]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!consent) {
      setError('É necessário aceitar a Política de Privacidade para continuar.');
      return;
    }
    setSubmitting(true);
    try {
      const { user } = await api<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role, consent }),
      });
      setUser(user);
      router.replace('/registro');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Criar conta" subtitle="Comece a acompanhar seu bem-estar emocional.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        <div>
          <label htmlFor="name" className="label">
            Nome
          </label>
          <input id="name" required autoComplete="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="label">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="role" className="label">
            Você é
          </label>
          <select id="role" className="input" value={form.role} onChange={(e) => update('role', e.target.value)}>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="label">
              Confirmar senha
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
              value={form.confirm}
              onChange={(e) => update('confirm', e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">A senha deve ter ao menos 8 caracteres.</p>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Li e concordo com a{' '}
            <Link href="/privacidade" target="_blank" className="font-semibold text-brand-700 underline">
              Política de Privacidade
            </Link>{' '}
            e autorizo o tratamento dos meus dados de humor para as finalidades descritas, conforme a LGPD, incluindo o
            seu armazenamento em servidores localizados fora do Brasil.
          </span>
        </label>
        {form.role === 'ESTUDANTE' && (
          <Alert type="info">
            Estudantes menores de 18 anos devem realizar o cadastro com a ciência e o consentimento de um dos pais ou
            responsável legal (LGPD, art. 14).
          </Alert>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
