'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, PageHeader, Spinner, SupportCard } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { MOODS, emotionInfo, factorInfo, moodInfo } from '@/lib/constants';
import { formatShort, todayISO } from '@/lib/dates';
import type { Summary } from '@/lib/types';

const PERIODS = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '3 meses' },
  { days: 365, label: '1 ano' },
];

function fmt(value: number | null, suffix = '') {
  return value === null ? '—' : `${value.toFixed(1).replace('.', ',')}${suffix}`;
}

export default function PainelPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api<Summary>(`/analytics/summary?days=${days}&today=${todayISO()}`)
      .then((data) => active && setSummary(data))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [days]);

  return (
    <>
      <PageHeader title="Meu painel" description="Acompanhe a evolução do seu humor e descubra seus padrões.">
        <div role="tablist" aria-label="Período" className="flex rounded-xl border border-slate-200 bg-white p-1">
          {PERIODS.map((period) => (
            <button
              key={period.days}
              role="tab"
              aria-selected={days === period.days}
              onClick={() => setDays(period.days)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                days === period.days ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {error && <Alert type="error">{error}</Alert>}
      {loading && !summary ? <Spinner /> : summary && <Dashboard summary={summary} />}
    </>
  );
}

function Dashboard({ summary }: { summary: Summary }) {
  const { stats } = summary;

  if (stats.entries === 0) {
    return (
      <div className="card text-center">
        <p className="text-4xl" aria-hidden>
          📈
        </p>
        <p className="mt-2 text-slate-600">Ainda não há registros neste período. Registre seu humor para ver seus gráficos!</p>
        <Link href="/registro" className="btn-primary mt-4">
          Registrar agora
        </Link>
      </div>
    );
  }

  const trend = stats.moodAverage !== null && stats.previousMoodAverage !== null ? stats.moodAverage - stats.previousMoodAverage : null;
  const average = stats.moodAverage ?? 3;
  const timeline = summary.timeline.map((point) => ({ ...point, label: formatShort(point.date) }));
  const distribution = summary.distribution.map((d) => ({ ...d, label: moodInfo(d.mood).emoji }));
  // Reordena para começar na segunda-feira
  const weekdays = [...summary.byWeekday.slice(1), summary.byWeekday[0]].map((w) => ({ ...w, short: w.label.slice(0, 3) }));
  const factors = summary.factors.filter((f) => f.impact !== null);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Humor médio"
          value={`${moodInfo(average).emoji} ${fmt(stats.moodAverage)}`}
          hint={trend === null ? 'de 1 a 5' : `${trend >= 0 ? '▲' : '▼'} ${fmt(Math.abs(trend))} vs. período anterior`}
          hintTone={trend === null ? 'neutral' : trend >= 0 ? 'good' : 'bad'}
        />
        <StatCard label="Registros" value={String(stats.entries)} hint={`${stats.adherence}% dos dias do período`} />
        <StatCard label="Sequência atual" value={`🔥 ${stats.streak}`} hint={stats.streak === 1 ? 'dia seguido' : 'dias seguidos'} />
        <StatCard label="Sono médio" value={fmt(stats.sleepAverage, 'h')} hint={`Energia média: ${fmt(stats.energyAverage)}`} />
      </div>

      {summary.insights.length > 0 && (
        <section className="card border-brand-200 bg-brand-50/60">
          <h2 className="font-semibold text-slate-900">💡 O que seus registros mostram</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {summary.insights.map((insight) => (
              <li key={insight} className="flex gap-2">
                <span aria-hidden>•</span>
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.moodAverage !== null && stats.moodAverage <= 2.5 && <SupportCard />}

      <ChartCard title="Evolução do humor e da energia" description="Escala de 1 (muito baixo) a 5 (muito alto).">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={16} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [name === 'Humor' ? `${moodInfo(Number(value)).emoji} ${moodInfo(Number(value)).label}` : value, name]}
            />
            <Legend />
            <Line type="monotone" dataKey="mood" name="Humor" stroke="#1d5ef1" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="energy" name="Energia" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Distribuição do humor" description="Quantos dias em cada nível de humor.">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 20 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value} dia(s)`, 'Registros']} labelFormatter={(_, payload) => moodInfo(payload?.[0]?.payload?.mood ?? 3).label} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distribution.map((d) => (
                  <Cell key={d.mood} fill={MOODS[d.mood - 1].color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Humor por dia da semana" description="Média do humor em cada dia.">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekdays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="short" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [fmt(Number(value)), 'Humor médio']} labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''} />
              <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                {weekdays.map((w) => (
                  <Cell key={w.weekday} fill={w.average === null ? '#cbd5e1' : moodInfo(w.average).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Fatores associados ao seu humor"
          description="Diferença entre o humor nos dias com cada fator e a sua média geral."
        >
          {factors.length === 0 ? (
            <p className="text-sm text-slate-500">Marque os fatores ao registrar seu humor para ver esta análise.</p>
          ) : (
            <ul className="space-y-2.5">
              {factors.map((f) => {
                const info = factorInfo(f.factor);
                const impact = f.impact ?? 0;
                const width = Math.min(100, (Math.abs(impact) / 2) * 100);
                return (
                  <li key={f.factor} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-3 text-sm">
                    <span className="truncate text-slate-700">
                      {info.emoji} {info.label} <span className="text-slate-400">({f.count})</span>
                    </span>
                    <div className="relative h-3 rounded-full bg-slate-100">
                      <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
                      <div
                        className={`absolute inset-y-0 rounded-full ${impact >= 0 ? 'left-1/2 bg-green-500' : 'right-1/2 bg-rose-500'}`}
                        style={{ width: `${width / 2}%` }}
                      />
                    </div>
                    <span className={`w-10 text-right font-medium ${impact >= 0 ? 'text-green-700' : 'text-rose-700'}`}>
                      {impact > 0 ? '+' : ''}
                      {fmt(impact)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>

        <div className="space-y-5">
          <ChartCard title="Emoções mais frequentes">
            {summary.emotions.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma emoção marcada no período.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {summary.emotions.slice(0, 8).map((e) => {
                  const info = emotionInfo(e.emotion);
                  return (
                    <span key={e.emotion} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {info.emoji} {info.label} <strong className="ml-1">{e.count}</strong>
                    </span>
                  );
                })}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Sono × humor" description="Humor médio de acordo com as horas dormidas.">
            <div className="grid grid-cols-3 gap-3 text-center">
              {summary.sleep.map((bucket) => (
                <div key={bucket.label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-2xl" aria-hidden>
                    {bucket.average === null ? '—' : moodInfo(bucket.average).emoji}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{fmt(bucket.average)}</p>
                  <p className="text-xs text-slate-500">{bucket.label}</p>
                  <p className="text-xs text-slate-400">{bucket.count} dia(s)</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  hintTone = 'neutral',
}: {
  label: string;
  value: string;
  hint: string;
  hintTone?: 'neutral' | 'good' | 'bad';
}) {
  const tones = { neutral: 'text-slate-500', good: 'text-green-700', bad: 'text-rose-700' };
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
      <p className={`mt-1 text-xs ${tones[hintTone]}`}>{hint}</p>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
