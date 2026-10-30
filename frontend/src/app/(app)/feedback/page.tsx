'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { LikertScale } from '@/components/likert';
import { Alert, PageHeader, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { SELF_AWARENESS_QUESTION, SUS_QUESTIONS, USEFULNESS_QUESTION } from '@/lib/feedback';
import type { Feedback } from '@/lib/types';

interface FormState {
  susAnswers: number[];
  usefulness: number;
  selfAwareness: number;
  liked: string;
  improve: string;
}

const EMPTY_FORM: FormState = {
  susAnswers: Array(SUS_QUESTIONS.length).fill(0),
  usefulness: 0,
  selfAwareness: 0,
  liked: '',
  improve: '',
};

export default function FeedbackPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existing, setExisting] = useState<Feedback | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    api<{ feedback: Feedback | null }>('/feedback/me')
      .then(({ feedback }) => {
        setExisting(feedback);
        if (feedback) {
          setForm({
            susAnswers: feedback.susAnswers,
            usefulness: feedback.usefulness,
            selfAwareness: feedback.selfAwareness,
            liked: feedback.liked ?? '',
            improve: feedback.improve ?? '',
          });
        }
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const answered = form.susAnswers.filter(Boolean).length + (form.usefulness ? 1 : 0) + (form.selfAwareness ? 1 : 0);
  const totalQuestions = SUS_QUESTIONS.length + 2;

  function setSus(index: number, value: number) {
    setForm((current) => ({ ...current, susAnswers: current.susAnswers.map((v, i) => (i === index ? value : v)) }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (answered < totalQuestions) {
      setError(`Responda todas as afirmações (${answered} de ${totalQuestions} respondidas).`);
      return;
    }
    if (!consent) {
      setError('É necessário autorizar o uso anônimo das respostas para enviar a avaliação.');
      return;
    }
    setSaving(true);
    try {
      const { feedback } = await api<{ feedback: Feedback }>('/feedback', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          liked: form.liked.trim() || null,
          improve: form.improve.trim() || null,
          researchConsent: consent,
        }),
      });
      setExisting(feedback);
      setDeleted(false);
      setSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Deseja excluir sua avaliação? Ela deixará de fazer parte dos resultados do projeto.')) return;
    setDeleting(true);
    setError('');
    try {
      await api('/feedback', { method: 'DELETE' });
      setExisting(null);
      setForm(EMPTY_FORM);
      setConsent(false);
      setDeleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Spinner />;

  if (sent) {
    return (
      <div className="card mx-auto max-w-xl text-center">
        <p className="text-5xl" aria-hidden>
          🙏
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Obrigado pela sua avaliação!</h1>
        <p className="mt-2 text-slate-600">
          Suas respostas vão ajudar a melhorar o Humor Diário e farão parte, de forma anônima, da análise do projeto.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/registro" className="btn-primary">
            Voltar ao diário
          </Link>
          <button className="btn-secondary" onClick={() => setSent(false)}>
            Revisar minhas respostas
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Avalie o Humor Diário"
        description="Sua opinião ajuda a melhorar a aplicação e faz parte da avaliação do projeto. Leva cerca de 3 minutos."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {deleted && <Alert type="success">Sua avaliação foi excluída e não faz mais parte dos resultados.</Alert>}
        {existing && (
          <div className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Você já enviou sua avaliação em {new Date(existing.updatedAt).toLocaleDateString('pt-BR')}. Pode alterar suas
              respostas e enviar novamente.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="shrink-0 rounded-lg px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              {deleting ? 'Excluindo...' : 'Excluir minha avaliação'}
            </button>
          </div>
        )}

        <section className="card">
          <h2 className="font-semibold text-slate-900">1. Facilidade de uso</h2>
          <p className="mt-1 text-sm text-slate-500">
            Para cada afirmação, indique o quanto você concorda, de 1 (discordo totalmente) a 5 (concordo totalmente).
          </p>
          <div className="mt-2">
            {SUS_QUESTIONS.map((question, index) => (
              <LikertScale
                key={index}
                id={`sus-${index}`}
                number={index + 1}
                question={question}
                value={form.susAnswers[index]}
                onChange={(value) => setSus(index, value)}
              />
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="font-semibold text-slate-900">2. Utilidade para o seu bem-estar</h2>
          <div className="mt-2">
            <LikertScale
              id="usefulness"
              question={USEFULNESS_QUESTION}
              value={form.usefulness}
              onChange={(usefulness) => setForm((current) => ({ ...current, usefulness }))}
            />
            <LikertScale
              id="self-awareness"
              question={SELF_AWARENESS_QUESTION}
              value={form.selfAwareness}
              onChange={(selfAwareness) => setForm((current) => ({ ...current, selfAwareness }))}
            />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-slate-900">
            3. Comentários <span className="font-normal text-slate-400">(opcional)</span>
          </h2>
          <p className="text-sm text-slate-500">Não escreva seu nome nem informações que possam identificar você ou outras pessoas.</p>
          <div>
            <label htmlFor="liked" className="label">
              O que você mais gostou?
            </label>
            <textarea
              id="liked"
              rows={3}
              maxLength={1000}
              className="input resize-y"
              value={form.liked}
              onChange={(e) => setForm((current) => ({ ...current, liked: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="improve" className="label">
              O que poderia melhorar?
            </label>
            <textarea
              id="improve"
              rows={3}
              maxLength={1000}
              className="input resize-y"
              value={form.improve}
              onChange={(e) => setForm((current) => ({ ...current, improve: e.target.value }))}
            />
          </div>
        </section>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Autorizo o uso <strong>anônimo</strong> destas respostas no trabalho acadêmico do projeto. Os responsáveis veem
            apenas resultados agregados e comentários sem identificação, nunca meus registros de humor.{' '}
            <Link href="/privacidade" target="_blank" className="font-semibold text-brand-700 underline">
              Saiba mais
            </Link>
            .
          </span>
        </label>

        {error && <Alert type="error">{error}</Alert>}

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {answered} de {totalQuestions} afirmações respondidas
          </p>
          <button type="submit" className="btn-primary px-6 py-3" disabled={saving}>
            {saving ? 'Enviando...' : existing ? 'Atualizar avaliação' : 'Enviar avaliação'}
          </button>
        </div>
      </form>
    </>
  );
}
