import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { addDays, dateSchema, formatDate, toDate, todayUTC } from '../lib/dates';
import { FACTOR_KEYS, FACTOR_LABELS, WEEKDAY_LABELS } from '../constants';

const querySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((value) => [7, 30, 90, 365].includes(value), 'Período inválido.')
    .default(30),
  // "Hoje" segundo o fuso do usuário, enviado pelo frontend
  today: dateSchema.optional(),
});

type EntryData = {
  date: Date;
  mood: number;
  energy: number;
  sleepHours: number | null;
  emotions: string[];
  factors: string[];
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')}`;
}

function computeStreak(dates: Set<string>, end: Date): number {
  let cursor = dates.has(formatDate(end)) ? end : addDays(end, -1);
  let streak = 0;
  while (dates.has(formatDate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/summary', async (request) => {
    const { days, today } = querySchema.parse(request.query);
    const userId = request.user.sub;

    const end = today ? toDate(today) : todayUTC();
    const start = addDays(end, -(days - 1));
    const previousStart = addDays(start, -days);

    const [entries, previous, recentDates] = await Promise.all([
      prisma.moodEntry.findMany({
        where: { userId, date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
        select: { date: true, mood: true, energy: true, sleepHours: true, emotions: true, factors: true },
      }),
      prisma.moodEntry.aggregate({
        where: { userId, date: { gte: previousStart, lt: start } },
        _avg: { mood: true },
        _count: true,
      }),
      prisma.moodEntry.findMany({
        where: { userId, date: { lte: end } },
        orderBy: { date: 'desc' },
        select: { date: true },
        take: 400,
      }),
    ]);

    const moodAverage = average(entries.map((e) => e.mood));
    const previousAverage = previous._avg.mood !== null ? Math.round(previous._avg.mood * 10) / 10 : null;
    const sleepValues = entries.filter((e) => e.sleepHours !== null).map((e) => e.sleepHours as number);

    const distribution = [1, 2, 3, 4, 5].map((mood) => ({
      mood,
      count: entries.filter((e) => e.mood === mood).length,
    }));

    const byWeekday = WEEKDAY_LABELS.map((label, weekday) => {
      const items = entries.filter((e) => e.date.getUTCDay() === weekday);
      return { weekday, label, average: average(items.map((e) => e.mood)), count: items.length };
    });

    const factors = FACTOR_KEYS.map((factor) => {
      const items = entries.filter((e) => e.factors.includes(factor));
      const avg = average(items.map((e) => e.mood));
      return {
        factor,
        label: FACTOR_LABELS[factor],
        count: items.length,
        average: avg,
        impact: avg !== null && moodAverage !== null ? Math.round((avg - moodAverage) * 10) / 10 : null,
      };
    })
      .filter((f) => f.count > 0)
      .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));

    const emotionCounts = new Map<string, number>();
    entries.forEach((e) => e.emotions.forEach((em) => emotionCounts.set(em, (emotionCounts.get(em) ?? 0) + 1)));
    const emotions = [...emotionCounts.entries()]
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);

    const sleepBuckets = [
      { label: 'Menos de 6h', test: (h: number) => h < 6 },
      { label: 'De 6h a 8h', test: (h: number) => h >= 6 && h <= 8 },
      { label: 'Mais de 8h', test: (h: number) => h > 8 },
    ].map(({ label, test }) => {
      const items = entries.filter((e) => e.sleepHours !== null && test(e.sleepHours));
      return { label, average: average(items.map((e) => e.mood)), count: items.length };
    });

    return {
      period: { days, from: formatDate(start), to: formatDate(end) },
      stats: {
        entries: entries.length,
        moodAverage,
        previousMoodAverage: previousAverage,
        energyAverage: average(entries.map((e) => e.energy)),
        sleepAverage: average(sleepValues),
        streak: computeStreak(new Set(recentDates.map((d) => formatDate(d.date))), end),
        adherence: Math.round((entries.length / days) * 100),
      },
      timeline: entries.map((e) => ({ date: formatDate(e.date), mood: e.mood, energy: e.energy, sleepHours: e.sleepHours })),
      distribution,
      byWeekday,
      factors,
      emotions,
      sleep: sleepBuckets,
      insights: buildInsights(entries, moodAverage, previousAverage, byWeekday, factors, sleepBuckets),
    };
  });
}

function buildInsights(
  entries: EntryData[],
  moodAverage: number | null,
  previousAverage: number | null,
  byWeekday: { label: string; average: number | null; count: number }[],
  factors: { label: string; count: number; impact: number | null }[],
  sleep: { label: string; average: number | null; count: number }[],
): string[] {
  if (entries.length === 0 || moodAverage === null) return [];
  const insights: string[] = [];

  if (entries.length < 5) {
    insights.push('Continue registrando! Com mais alguns dias de registro, os padrões ficam mais confiáveis.');
  }

  if (previousAverage !== null) {
    const diff = moodAverage - previousAverage;
    if (Math.abs(diff) >= 0.3) {
      insights.push(
        diff > 0
          ? `Seu humor médio melhorou em relação ao período anterior (${signed(diff)} ponto).`
          : `Seu humor médio caiu em relação ao período anterior (${signed(diff)} ponto). Que tal observar o que mudou na rotina?`,
      );
    } else {
      insights.push('Seu humor médio se manteve estável em relação ao período anterior.');
    }
  }

  const relevantFactors = factors.filter((f) => f.count >= 3 && f.impact !== null);
  const best = relevantFactors[0];
  if (best && (best.impact ?? 0) >= 0.3) {
    insights.push(`Nos dias em que você marcou "${best.label}", seu humor ficou ${signed(best.impact!)} ponto acima da sua média.`);
  }
  const worst = relevantFactors[relevantFactors.length - 1];
  if (worst && worst !== best && (worst.impact ?? 0) <= -0.3) {
    insights.push(`Nos dias em que você marcou "${worst.label}", seu humor ficou ${signed(worst.impact!)} ponto abaixo da sua média.`);
  }

  const weekdays = byWeekday.filter((w) => w.count >= 2 && w.average !== null);
  if (weekdays.length >= 3) {
    const sorted = [...weekdays].sort((a, b) => b.average! - a.average!);
    insights.push(`Seu melhor dia da semana costuma ser ${sorted[0].label}; o mais difícil, ${sorted[sorted.length - 1].label}.`);
  }

  const [little, enough, plenty] = sleep;
  if (little.count >= 2 && enough.count >= 2 && enough.average! - little.average! >= 0.5) {
    insights.push('Seu humor tende a ser melhor quando você dorme entre 6 e 8 horas.');
  } else if (plenty.count >= 2 && enough.count >= 2 && plenty.average! - enough.average! >= 0.5) {
    insights.push('Seu humor tende a ser melhor quando você dorme mais de 8 horas.');
  }

  if (moodAverage <= 2.5 && entries.length >= 3) {
    insights.push(
      'Seu humor esteve mais baixo neste período. Conversar com alguém de confiança pode ajudar — e o CVV atende gratuitamente pelo telefone 188, 24 horas por dia.',
    );
  }

  return insights;
}
