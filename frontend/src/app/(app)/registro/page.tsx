'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { ChipGroup, EnergyPicker, MoodPicker } from '@/components/pickers';
import { Alert, PageHeader, Spinner, SupportCard } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { EMOTIONS, FACTORS, moodInfo } from '@/lib/constants';
import { formatLong, todayISO } from '@/lib/dates';
import type { Entry } from '@/lib/types';

interface FormState {
  mood: number;
  energy: number;
  sleepHours: string;
  emotions: string[];
  factors: string[];
  note: string;
}

const EMPTY_FORM: FormState = { mood: 0, energy: 0, sleepHours: '', emotions: [], factors: [], note: '' };

export default function RegistroPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const searchParams = useSearchParams();
  const today = todayISO();
  const [date, setDate] = useState(searchParams.get('data') ?? today);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existing, setExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savedMood, setSavedMood] = useState<number | null>(null);

  // Carrega o registro já existente para a data selecionada (se houver)
  useEffect(() => {
    let active = true;
    setLoading(true);
    setStatus(null);
    setSavedMood(null);
    api<{ entries: Entry[] }>(`/entries?from=${date}&to=${date}`)
      .then(({ entries }) => {
        if (!active) return;
        const entry = entries[0];
        setExisting(Boolean(entry));
        setForm(
          entry
            ? {
                mood: entry.mood,
                energy: entry.energy,
                sleepHours: entry.sleepHours?.toString() ?? '',
                emotions: entry.emotions,
                factors: entry.factors,
                note: entry.note ?? '',
              }
            : EMPTY_FORM,
        );
      })
      .catch((err) => active && setStatus({ type: 'error', message: errorMessage(err) }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [date]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.mood || !form.energy) {
      setStatus({ type: 'error', message: 'Selecione seu humor e seu nível de energia.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await api(`/entries/${date}`, {
        method: 'PUT',
        body: JSON.stringify({
          mood: form.mood,
          energy: form.energy,
          sleepHours: form.sleepHours === '' ? null : Number(form.sleepHours.replace(',', '.')),
          emotions: form.emotions,
          factors: form.factors,
          note: form.note.trim() || null,
        }),
      });
      setExisting(true);
      setSavedMood(form.mood);
      setStatus({ type: 'success', message: existing ? 'Registro atualizado com sucesso!' : 'Registro salvo! Obrigado por cuidar de você hoje. 💙' });
    } catch (err) {
      setStatus({ type: 'error', message: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={date === today ? 'Como você está hoje?' : 'Registro de humor'}
        description={formatLong(date)}
      >
        <div>
          <label htmlFor="date" className="label">
            Data do registro
          </label>
          <input id="date" type="date" className="input" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      </PageHeader>

      {loading ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {existing && !status && <Alert type="info">Você já registrou este dia. Pode editar as informações abaixo.</Alert>}

          <section className="card">
            <h2 className="mb-4 font-semibold text-slate-900">
              1. Qual é o seu humor? <span className="text-rose-600">*</span>
            </h2>
            <MoodPicker value={form.mood} onChange={(v) => update('mood', v)} />
          </section>

          <section className="card">
            <h2 className="mb-4 font-semibold text-slate-900">
              2. Como está sua energia? <span className="text-rose-600">*</span>
            </h2>
            <EnergyPicker value={form.energy} onChange={(v) => update('energy', v)} />
          </section>

          <section className="card">
            <h2 className="mb-1 font-semibold text-slate-900">3. Que emoções você sentiu?</h2>
            <p className="mb-4 text-sm text-slate-500">Selecione quantas quiser.</p>
            <ChipGroup label="Emoções" options={EMOTIONS} selected={form.emotions} onChange={(v) => update('emotions', v)} />
          </section>

          <section className="card">
            <h2 className="mb-1 font-semibold text-slate-900">4. O que influenciou seu dia?</h2>
            <p className="mb-4 text-sm text-slate-500">Esses fatores ajudam a descobrir o que afeta seu humor.</p>
            <ChipGroup label="Fatores" options={FACTORS} selected={form.factors} onChange={(v) => update('factors', v)} />
          </section>

          <section className="card grid gap-5 sm:grid-cols-[200px_1fr]">
            <div>
              <label htmlFor="sleep" className="label">
                Horas de sono
              </label>
              <input
                id="sleep"
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step={0.5}
                placeholder="Ex.: 7,5"
                className="input"
                value={form.sleepHours}
                onChange={(e) => update('sleepHours', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="note" className="label">
                Anotações <span className="font-normal text-slate-400">(opcional, criptografada)</span>
              </label>
              <textarea
                id="note"
                rows={3}
                maxLength={1000}
                placeholder="Algo que queira lembrar sobre hoje?"
                className="input resize-y"
                value={form.note}
                onChange={(e) => update('note', e.target.value)}
              />
              <p className="mt-1 text-right text-xs text-slate-400">{form.note.length}/1000</p>
            </div>
          </section>

          {status && <Alert type={status.type}>{status.message}</Alert>}
          {savedMood !== null && savedMood <= 2 && <SupportCard />}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {savedMood !== null && (
              <Link href="/painel" className="btn-secondary">
                Ver meu painel
              </Link>
            )}
            <button type="submit" className="btn-primary px-6 py-3" disabled={saving}>
              {saving ? 'Salvando...' : existing ? 'Atualizar registro' : `Salvar registro${form.mood ? ` ${moodInfo(form.mood).emoji}` : ''}`}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
