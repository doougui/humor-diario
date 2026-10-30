'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, PageHeader, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { ENERGY_LABELS, emotionInfo, factorInfo, moodInfo } from '@/lib/constants';
import { currentMonth, formatMonth, formatWeekdayDay, monthRange, shiftMonth } from '@/lib/dates';
import type { Entry } from '@/lib/types';

export default function HistoricoPage() {
  const [month, setMonth] = useState(currentMonth());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const { from, to } = monthRange(month);
    setLoading(true);
    setError('');
    api<{ entries: Entry[] }>(`/entries?from=${from}&to=${to}`)
      .then(({ entries }) => active && setEntries(entries))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [month]);

  async function handleDelete(entry: Entry) {
    if (!window.confirm('Deseja realmente excluir este registro? Esta ação não pode ser desfeita.')) return;
    try {
      await api(`/entries/${entry.date}`, { method: 'DELETE' });
      setEntries((current) => current.filter((e) => e.id !== entry.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const isCurrentMonth = month === currentMonth();
  const average = entries.length ? entries.reduce((sum, e) => sum + e.mood, 0) / entries.length : null;

  return (
    <>
      <PageHeader title="Histórico" description="Veja, edite ou exclua seus registros anteriores." />

      <div className="card mb-5 flex items-center justify-between gap-3 py-3 sm:py-4">
        <button className="btn-secondary px-3" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior">
          ←
        </button>
        <div className="text-center">
          <p className="font-semibold capitalize text-slate-900">{formatMonth(month)}</p>
          <p className="text-sm text-slate-500">
            {entries.length} registro(s)
            {average !== null && ` · média ${moodInfo(average).emoji} ${average.toFixed(1).replace('.', ',')}`}
          </p>
        </div>
        <button
          className="btn-secondary px-3"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={isCurrentMonth}
          aria-label="Próximo mês"
        >
          →
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <div className="card text-center">
          <p className="text-4xl" aria-hidden>
            📭
          </p>
          <p className="mt-2 text-slate-600">Nenhum registro neste mês.</p>
          <Link href="/registro" className="btn-primary mt-4">
            Registrar humor
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const mood = moodInfo(entry.mood);
            const { weekday, day } = formatWeekdayDay(entry.date);
            return (
              <li key={entry.id} className="card flex gap-4 p-4 sm:p-5">
                <div className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl ${mood.bg} py-2`}>
                  <span className="text-3xl" aria-hidden>
                    {mood.emoji}
                  </span>
                  <span className="text-[11px] font-medium text-slate-700">{mood.label}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold capitalize text-slate-900">
                      {weekday}, {day}
                    </p>
                    <div className="flex gap-1">
                      <Link href={`/registro?data=${entry.date}`} className="rounded-lg px-2 py-1 text-sm text-brand-700 hover:bg-brand-50">
                        Editar
                      </Link>
                      <button onClick={() => handleDelete(entry)} className="rounded-lg px-2 py-1 text-sm text-rose-600 hover:bg-rose-50">
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Energia: {ENERGY_LABELS[entry.energy - 1].toLowerCase()}
                    {entry.sleepHours !== null && ` · Sono: ${entry.sleepHours.toString().replace('.', ',')}h`}
                  </p>
                  {(entry.emotions.length > 0 || entry.factors.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.emotions.map((key) => {
                        const emotion = emotionInfo(key);
                        return (
                          <span key={key} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                            {emotion.emoji} {emotion.label}
                          </span>
                        );
                      })}
                      {entry.factors.map((key) => {
                        const factor = factorInfo(key);
                        return (
                          <span key={key} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-800">
                            {factor.emoji} {factor.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {entry.note && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">“{entry.note}”</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
