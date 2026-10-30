'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert, PageHeader } from '@/components/ui';
import { useAuth } from '@/contexts/auth';
import { api, errorMessage } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import type { Role, User } from '@/lib/types';

export default function ContaPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'ESTUDANTE');
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [exportError, setExportError] = useState('');
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState<'profile' | 'export' | 'delete' | null>(null);

  if (!user) return null;

  async function handleProfile(event: FormEvent) {
    event.preventDefault();
    setBusy('profile');
    setProfileStatus(null);
    try {
      const { user } = await api<{ user: User }>('/account', { method: 'PUT', body: JSON.stringify({ name, role }) });
      setUser(user);
      setProfileStatus({ type: 'success', message: 'Dados atualizados.' });
    } catch (err) {
      setProfileStatus({ type: 'error', message: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  async function handleExport() {
    setBusy('export');
    setExportError('');
    try {
      const data = await api('/account/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'meus-dados-humor-diario.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(event: FormEvent) {
    event.preventDefault();
    if (!window.confirm('Tem certeza? Sua conta e TODOS os seus registros serão excluídos permanentemente.')) return;
    setBusy('delete');
    setDeleteError('');
    try {
      await api('/account', { method: 'DELETE', body: JSON.stringify({ password }) });
      setUser(null);
      router.replace('/');
    } catch (err) {
      setDeleteError(errorMessage(err));
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Minha conta" description="Gerencie seus dados e sua privacidade." />

      <div className="space-y-5">
        <section className="card">
          <h2 className="font-semibold text-slate-900">Dados pessoais</h2>
          <form onSubmit={handleProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">
                Nome
              </label>
              <input id="name" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="role" className="label">
                Perfil
              </label>
              <select id="role" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-500">
                E-mail: <strong className="text-slate-700">{user.email}</strong> · Consentimento registrado em{' '}
                {new Date(user.consentAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            {profileStatus && (
              <div className="sm:col-span-2">
                <Alert type={profileStatus.type}>{profileStatus.message}</Alert>
              </div>
            )}
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary" disabled={busy !== null}>
                {busy === 'profile' ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <h2 className="font-semibold text-slate-900">Baixar meus dados</h2>
          <p className="mt-1 text-sm text-slate-600">
            Receba uma cópia completa dos seus dados e registros em formato JSON (direito de acesso e portabilidade — LGPD,
            art. 18).
          </p>
          {exportError && (
            <div className="mt-3">
              <Alert type="error">{exportError}</Alert>
            </div>
          )}
          <button onClick={handleExport} className="btn-secondary mt-4" disabled={busy !== null}>
            {busy === 'export' ? 'Gerando arquivo...' : '⬇️ Exportar meus dados'}
          </button>
        </section>

        <section className="card border-rose-200">
          <h2 className="font-semibold text-rose-700">Excluir conta</h2>
          <p className="mt-1 text-sm text-slate-600">
            Revoga seu consentimento e apaga permanentemente sua conta e todos os seus registros. Esta ação não pode ser
            desfeita.
          </p>
          <form onSubmit={handleDelete} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="delete-password" className="label">
                Confirme sua senha
              </label>
              <input
                id="delete-password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-danger" disabled={busy !== null}>
              {busy === 'delete' ? 'Excluindo...' : 'Excluir minha conta'}
            </button>
          </form>
          {deleteError && (
            <div className="mt-3">
              <Alert type="error">{deleteError}</Alert>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
