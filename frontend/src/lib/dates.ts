// Datas de registro são dias de calendário no formato "AAAA-MM-DD", sempre no fuso local do usuário.

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

function parse(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatLong(iso: string): string {
  return parse(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShort(iso: string): string {
  return parse(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function formatWeekdayDay(iso: string): { weekday: string; day: string } {
  const date = parse(iso);
  return {
    weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''),
  };
}

export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

export function monthRange(month: string): { from: string; to: string } {
  const [year, m] = month.split('-').map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${pad(lastDay)}` };
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}
