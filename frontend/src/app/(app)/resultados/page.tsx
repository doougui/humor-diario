'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Alert, PageHeader, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/auth';
import { API_URL, api, errorMessage } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import { LIKERT_LABELS, SELF_AWARENESS_QUESTION, SUS_QUESTIONS, USEFULNESS_QUESTION } from '@/lib/feedback';
import type { FeedbackResults, Role } from '@/lib/types';

const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a',
  B: '#65a30d',
  C: '#eab308',
  D: '#f97316',
  F: '#e11d48',
};

function fmt(value: number | null, digits = 1) {
  return value === null ? '—' : value.toFixed(digits).replace('.', ',');
}

function roleLabel(role: Role | null) {
  return role ? (ROLES.find((r) => r.value === role)?.label ?? role) : 'Perfil não exibido';
}

export default function ResultadosPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<FeedbackResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    api<FeedbackResults>('/feedback/results')
      .then(setResults)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [user?.isAdmin]);

  if (!user?.isAdmin) {
    return <Alert type="error">Esta página é restrita aos responsáveis pelo projeto.</Alert>;
  }

  return (
    <>
      <PageHeader title="Resultados das avaliações" description="Respostas anônimas e agregadas do questionário de avaliação.">
        {results && results.total > 0 && (
          <a href={`${API_URL}/feedback/export.csv`} download className="btn-secondary">
            ⬇️ Exportar CSV (Excel)
          </a>
        )}
      </PageHeader>

      {error && <Alert type="error">{error}</Alert>}
      {loading ? <Spinner /> : results && <Results results={results} />}
    </>
  );
}

function Results({ results }: { results: FeedbackResults }) {
  if (results.total === 0) {
    return (
      <div className="card text-center">
        <p className="text-4xl" aria-hidden>
          📋
        </p>
        <p className="mt-2 text-slate-600">Nenhuma avaliação recebida ainda. Os participantes respondem pela página &quot;Avaliar&quot;.</p>
      </div>
    );
  }

  const { sus } = results;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Avaliações recebidas" value={String(results.total)} hint={`Média de ${fmt(results.entriesAverage)} registros de humor por participante`} />
        <Stat label="Pontuação SUS média" value={fmt(sus.average)} hint={sus.grade ? `Nota ${sus.grade} — ${sus.label}` : ''} />
        <Stat label="Utilidade do painel" value={`${fmt(results.usefulness.average)} / 5`} hint="Média de concordância" />
        <Stat label="Autoconhecimento" value={`${fmt(results.selfAwareness.average)} / 5`} hint="Média de concordância" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Usabilidade — System Usability Scale (SUS)"
          description="Pontuação de 0 a 100. A média de referência de mercado é 68 (Sauro; Lewis, 2016)."
        >
          <dl className="mb-4 grid grid-cols-4 gap-2 text-center text-sm">
            {[
              ['Mediana', fmt(sus.median)],
              ['Desvio padrão', fmt(sus.standardDeviation)],
              ['Mínimo', fmt(sus.min)],
              ['Máximo', fmt(sus.max)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-2">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sus.distribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value} participante(s)`, 'Respostas']}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? `Nota ${item.grade} — ${item.label}` : '';
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {sus.distribution.map((d) => (
                  <Cell key={d.grade} fill={GRADE_COLORS[d.grade]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-slate-500">
            Notas: A ≥ 80,3 (excelente) · B ≥ 74 (bom) · C ≥ 68 (na média) · D ≥ 51 (abaixo da média) · F &lt; 51 (ruim).
          </p>
        </Card>

        <Card title="Por perfil" description={`Grupos com menos de ${results.minGroupSize} respostas não são detalhados, para preservar o anonimato.`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 font-medium">Perfil</th>
                  <th className="py-2 text-right font-medium">Respostas</th>
                  <th className="py-2 text-right font-medium">SUS</th>
                  <th className="py-2 text-right font-medium">Utilidade</th>
                  <th className="py-2 text-right font-medium">Autocon.</th>
                </tr>
              </thead>
              <tbody>
                {results.byRole.map((row) => (
                  <tr key={row.role} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 text-slate-800">{roleLabel(row.role)}</td>
                    <td className="py-2 text-right">{row.count}</td>
                    {row.hidden ? (
                      <td colSpan={3} className="py-2 text-right text-xs text-slate-400">
                        poucas respostas
                      </td>
                    ) : (
                      <>
                        <td className="py-2 text-right">{fmt(row.susAverage)}</td>
                        <td className="py-2 text-right">{fmt(row.usefulness)}</td>
                        <td className="py-2 text-right">{fmt(row.selfAwareness)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card
        title="Média por afirmação do SUS"
        description="Escala de 1 a 5. Nas afirmações positivas (+), quanto maior, melhor; nas negativas (−), quanto menor, melhor."
      >
        <ul className="space-y-3">
          {sus.questions.map((q) => {
            const good = q.average !== null && (q.positive ? q.average >= 3.5 : q.average <= 2.5);
            const bad = q.average !== null && (q.positive ? q.average <= 2.5 : q.average >= 3.5);
            return (
              <li key={q.number} className="grid gap-1 sm:grid-cols-[1fr_200px] sm:items-center sm:gap-4">
                <p className="text-sm text-slate-700">
                  <span className="mr-1 font-semibold text-slate-400">
                    {q.number} ({q.positive ? '+' : '−'})
                  </span>
                  {SUS_QUESTIONS[q.number - 1]}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${good ? 'bg-green-500' : bad ? 'bg-rose-500' : 'bg-amber-400'}`}
                      style={{ width: `${((q.average ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-slate-800">{fmt(q.average)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <LikertCard title={USEFULNESS_QUESTION} data={results.usefulness} />
        <LikertCard title={SELF_AWARENESS_QUESTION} data={results.selfAwareness} />
      </div>

      <Card title={`Comentários (${results.comments.length})`} description="Exibidos sem qualquer identificação do participante.">
        {results.comments.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum comentário recebido.</p>
        ) : (
          <ul className="space-y-3">
            {results.comments.map((comment, index) => (
              <li key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{roleLabel(comment.role)}</p>
                {comment.liked && (
                  <p className="text-slate-700">
                    <span className="font-semibold text-green-700">👍 Gostou: </span>
                    {comment.liked}
                  </p>
                )}
                {comment.improve && (
                  <p className="mt-1 text-slate-700">
                    <span className="font-semibold text-amber-700">🔧 Melhorar: </span>
                    {comment.improve}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-slate-500">
        Referências: BROOKE, J. SUS: a &quot;quick and dirty&quot; usability scale. In: JORDAN, P. W. et al. (ed.). Usability
        Evaluation in Industry. London: Taylor &amp; Francis, 1996. · SAURO, J.; LEWIS, J. R. Quantifying the User
        Experience. 2. ed. Cambridge: Morgan Kaufmann, 2016.
      </p>
    </div>
  );
}

function LikertCard({ title, data }: { title: string; data: FeedbackResults['usefulness'] }) {
  const total = data.distribution.reduce((sum, d) => sum + d.count, 0);
  const colors = ['#e11d48', '#f97316', '#94a3b8', '#65a30d', '#16a34a'];
  return (
    <Card title={title} description={`Média: ${fmt(data.average)} de 5`}>
      <div className="flex h-6 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Distribuição das respostas">
        {data.distribution.map((d) =>
          d.count > 0 ? (
            <div key={d.value} style={{ width: `${(d.count / total) * 100}%`, backgroundColor: colors[d.value - 1] }} title={`${LIKERT_LABELS[d.value - 1]}: ${d.count}`} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
        {data.distribution.map((d) => (
          <li key={d.value} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors[d.value - 1] }} aria-hidden />
            {LIKERT_LABELS[d.value - 1]}: <strong>{d.count}</strong> ({total ? Math.round((d.count / total) * 100) : 0}%)
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
