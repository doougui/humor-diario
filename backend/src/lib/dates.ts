import { z } from 'zod';

// Datas de registro são tratadas como dias de calendário ("AAAA-MM-DD"), sem fuso horário.
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');

export function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function todayUTC(): Date {
  return toDate(formatDate(new Date()));
}
