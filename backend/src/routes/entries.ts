import type { FastifyInstance } from 'fastify';
import type { MoodEntry } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { decrypt, encrypt } from '../lib/crypto';
import { addDays, dateSchema, formatDate, toDate, todayUTC } from '../lib/dates';
import { EMOTION_KEYS, FACTOR_KEYS } from '../constants';

const entrySchema = z.object({
  mood: z.number().int().min(1, 'Selecione seu humor.').max(5),
  energy: z.number().int().min(1, 'Selecione seu nível de energia.').max(5),
  sleepHours: z.number().min(0).max(24, 'Horas de sono devem estar entre 0 e 24.').nullable().optional(),
  emotions: z.array(z.enum(EMOTION_KEYS)).max(EMOTION_KEYS.length).default([]),
  factors: z.array(z.enum(FACTOR_KEYS)).max(FACTOR_KEYS.length).default([]),
  note: z.string().trim().max(1000, 'A anotação pode ter no máximo 1000 caracteres.').nullable().optional(),
});

const listQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

const dateParamSchema = z.object({ date: dateSchema });

export function serializeEntry(entry: MoodEntry) {
  return {
    id: entry.id,
    date: formatDate(entry.date),
    mood: entry.mood,
    energy: entry.energy,
    sleepHours: entry.sleepHours,
    emotions: entry.emotions,
    factors: entry.factors,
    note: entry.note ? decrypt(entry.note) : null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export async function entryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Lista os registros do usuário autenticado, opcionalmente filtrando por período
  app.get('/', async (request) => {
    const { from, to } = listQuerySchema.parse(request.query);
    const entries = await prisma.moodEntry.findMany({
      where: {
        userId: request.user.sub,
        date: { gte: from ? toDate(from) : undefined, lte: to ? toDate(to) : undefined },
      },
      orderBy: { date: 'desc' },
    });
    return { entries: entries.map(serializeEntry) };
  });

  // Cria ou atualiza o registro de um dia (um registro por dia por usuário)
  app.put('/:date', async (request, reply) => {
    const { date } = dateParamSchema.parse(request.params);
    const data = entrySchema.parse(request.body);
    const day = toDate(date);

    // Tolerância de 1 dia para diferenças de fuso horário entre cliente e servidor
    if (day > addDays(todayUTC(), 1)) {
      return reply.code(400).send({ message: 'Não é possível registrar o humor de uma data futura.' });
    }

    const payload = {
      mood: data.mood,
      energy: data.energy,
      sleepHours: data.sleepHours ?? null,
      emotions: [...new Set(data.emotions)],
      factors: [...new Set(data.factors)],
      note: data.note ? encrypt(data.note) : null,
    };

    const entry = await prisma.moodEntry.upsert({
      where: { userId_date: { userId: request.user.sub, date: day } },
      create: { ...payload, userId: request.user.sub, date: day },
      update: payload,
    });

    return { entry: serializeEntry(entry) };
  });

  app.delete('/:date', async (request, reply) => {
    const { date } = dateParamSchema.parse(request.params);
    const { count } = await prisma.moodEntry.deleteMany({
      where: { userId: request.user.sub, date: toDate(date) },
    });
    if (count === 0) {
      return reply.code(404).send({ message: 'Registro não encontrado.' });
    }
    return reply.code(204).send();
  });
}
