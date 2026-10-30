import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Feedback } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { env } from '../env';
import { ROLES } from '../constants';

const SUS_QUESTIONS = 10;
// Grupos com menos respostas que isso não têm estatísticas exibidas por perfil, para preservar o anonimato
const MIN_GROUP_SIZE = 3;

const likert = z.number().int().min(1).max(5);

const feedbackSchema = z.object({
  susAnswers: z.array(likert, { required_error: 'Responda todas as afirmações.' }).length(SUS_QUESTIONS, 'Responda todas as afirmações.'),
  usefulness: likert,
  selfAwareness: likert,
  liked: z.string().trim().max(1000, 'Use no máximo 1000 caracteres.').nullable().optional(),
  improve: z.string().trim().max(1000, 'Use no máximo 1000 caracteres.').nullable().optional(),
  researchConsent: z.literal(true, {
    errorMap: () => ({ message: 'É necessário autorizar o uso anônimo das respostas para enviar a avaliação.' }),
  }),
});

/**
 * Pontuação do System Usability Scale (Brooke, 1996): afirmações ímpares (positivas) valem resposta − 1,
 * afirmações pares (negativas) valem 5 − resposta; a soma é multiplicada por 2,5 (escala de 0 a 100).
 */
export function calculateSus(answers: number[]): number {
  const sum = answers.reduce((total, answer, index) => total + (index % 2 === 0 ? answer - 1 : 5 - answer), 0);
  return sum * 2.5;
}

// Escala de notas de Sauro e Lewis (2016); 68 é a média de referência
const SUS_GRADES = [
  { grade: 'A', label: 'Excelente', min: 80.3 },
  { grade: 'B', label: 'Bom', min: 74 },
  { grade: 'C', label: 'Na média', min: 68 },
  { grade: 'D', label: 'Abaixo da média', min: 51 },
  { grade: 'F', label: 'Ruim', min: 0 },
];

function susGrade(score: number) {
  const { grade, label } = SUS_GRADES.find((g) => score >= g.min)!;
  return { grade, label };
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]): number | null {
  return values.length ? round(values.reduce((sum, v) => sum + v, 0) / values.length) : null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : round((sorted[middle - 1] + sorted[middle]) / 2);
}

function standardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return round(Math.sqrt(variance));
}

function likertDistribution(values: number[]) {
  return [1, 2, 3, 4, 5].map((value) => ({ value, count: values.filter((v) => v === value).length }));
}

function serializeOwnFeedback(feedback: Feedback) {
  return {
    susAnswers: feedback.susAnswers,
    susScore: feedback.susScore,
    usefulness: feedback.usefulness,
    selfAwareness: feedback.selfAwareness,
    liked: feedback.liked,
    improve: feedback.improve,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
  };
}

async function requireAdmin(request: FastifyRequest) {
  const user = await prisma.user.findUnique({ where: { id: request.user.sub }, select: { email: true } });
  if (!user || !env.ADMIN_EMAILS.includes(user.email)) {
    throw Object.assign(new Error('Acesso restrito aos responsáveis pelo projeto.'), { statusCode: 403 });
  }
}

function csvCell(value: string | number | null): string {
  if (value === null) return '';
  const text = typeof value === 'number' ? String(value).replace('.', ',') : value.replace(/\s+/g, ' ');
  return `"${text.replace(/"/g, '""')}"`;
}

export async function feedbackRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Avaliação do próprio usuário (para exibir/editar)
  app.get('/me', async (request) => {
    const feedback = await prisma.feedback.findUnique({ where: { userId: request.user.sub } });
    return { feedback: feedback ? serializeOwnFeedback(feedback) : null };
  });

  // Envia ou atualiza a avaliação do usuário
  app.put('/', async (request) => {
    const data = feedbackSchema.parse(request.body);
    const userId = request.user.sub;
    const [user, entriesCount] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } }),
      prisma.moodEntry.count({ where: { userId } }),
    ]);

    const payload = {
      role: user.role,
      susAnswers: data.susAnswers,
      susScore: calculateSus(data.susAnswers),
      usefulness: data.usefulness,
      selfAwareness: data.selfAwareness,
      entriesCount,
      liked: data.liked || null,
      improve: data.improve || null,
    };

    const feedback = await prisma.feedback.upsert({
      where: { userId },
      create: { ...payload, userId },
      update: payload,
    });
    return { feedback: serializeOwnFeedback(feedback) };
  });

  // Exclui a própria avaliação (revogação da autorização de uso na pesquisa — LGPD, art. 8º, § 5º)
  app.delete('/', async (request, reply) => {
    const { count } = await prisma.feedback.deleteMany({ where: { userId: request.user.sub } });
    if (count === 0) {
      return reply.code(404).send({ message: 'Você ainda não enviou uma avaliação.' });
    }
    return reply.code(204).send();
  });

  // Resultados agregados e anônimos (somente administradores)
  app.get('/results', { preHandler: [requireAdmin] }, async () => {
    const feedbacks = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
    const scores = feedbacks.map((f) => f.susScore);
    const susAverage = average(scores);

    const byRole = ROLES.map((role) => {
      const items = feedbacks.filter((f) => f.role === role);
      const visible = items.length >= MIN_GROUP_SIZE;
      return {
        role,
        count: items.length,
        hidden: items.length > 0 && !visible,
        susAverage: visible ? average(items.map((f) => f.susScore)) : null,
        usefulness: visible ? average(items.map((f) => f.usefulness)) : null,
        selfAwareness: visible ? average(items.map((f) => f.selfAwareness)) : null,
      };
    });
    const visibleRoles = new Set(byRole.filter((r) => r.count >= MIN_GROUP_SIZE).map((r) => r.role));

    return {
      total: feedbacks.length,
      minGroupSize: MIN_GROUP_SIZE,
      sus: {
        average: susAverage,
        median: median(scores),
        standardDeviation: standardDeviation(scores),
        min: scores.length ? Math.min(...scores) : null,
        max: scores.length ? Math.max(...scores) : null,
        ...(susAverage !== null ? susGrade(susAverage) : { grade: null, label: null }),
        distribution: SUS_GRADES.map(({ grade, label }) => ({
          grade,
          label,
          count: scores.filter((s) => susGrade(s).grade === grade).length,
        })),
        questions: Array.from({ length: SUS_QUESTIONS }, (_, index) => ({
          number: index + 1,
          positive: index % 2 === 0,
          average: average(feedbacks.map((f) => f.susAnswers[index])),
        })),
      },
      usefulness: {
        average: average(feedbacks.map((f) => f.usefulness)),
        distribution: likertDistribution(feedbacks.map((f) => f.usefulness)),
      },
      selfAwareness: {
        average: average(feedbacks.map((f) => f.selfAwareness)),
        distribution: likertDistribution(feedbacks.map((f) => f.selfAwareness)),
      },
      entriesAverage: average(feedbacks.map((f) => f.entriesCount)),
      byRole,
      // Comentários sem qualquer identificação; o perfil só aparece se o grupo tiver respostas suficientes
      comments: feedbacks
        .filter((f) => f.liked || f.improve)
        .map((f) => ({
          role: visibleRoles.has(f.role) ? f.role : null,
          liked: f.liked,
          improve: f.improve,
        })),
    };
  });

  // Exporta as respostas anônimas em CSV (separador ";" e vírgula decimal, compatível com o Excel em português)
  app.get('/export.csv', { preHandler: [requireAdmin] }, async (_request, reply) => {
    const feedbacks = await prisma.feedback.findMany({ orderBy: { createdAt: 'asc' } });
    const header = [
      'data',
      'perfil',
      ...Array.from({ length: SUS_QUESTIONS }, (_, i) => `sus_q${i + 1}`),
      'pontuacao_sus',
      'utilidade_painel',
      'autoconhecimento',
      'registros_de_humor',
      'o_que_gostou',
      'o_que_melhorar',
    ];
    const rows = feedbacks.map((f) =>
      [
        f.createdAt.toISOString().slice(0, 10),
        f.role,
        ...f.susAnswers,
        f.susScore,
        f.usefulness,
        f.selfAwareness,
        f.entriesCount,
        f.liked,
        f.improve,
      ]
        .map(csvCell)
        .join(';'),
    );

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="avaliacoes-humor-diario.csv"');
    return '﻿' + [header.join(';'), ...rows].join('\r\n');
  });
}
