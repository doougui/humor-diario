import type { Role } from './types';

export const MOODS = [
  { value: 1, label: 'Muito mal', emoji: '😢', color: '#e11d48', bg: 'bg-rose-100', ring: 'ring-rose-400' },
  { value: 2, label: 'Mal', emoji: '🙁', color: '#f97316', bg: 'bg-orange-100', ring: 'ring-orange-400' },
  { value: 3, label: 'Neutro', emoji: '😐', color: '#eab308', bg: 'bg-yellow-100', ring: 'ring-yellow-400' },
  { value: 4, label: 'Bem', emoji: '🙂', color: '#22c55e', bg: 'bg-green-100', ring: 'ring-green-400' },
  { value: 5, label: 'Muito bem', emoji: '😄', color: '#0ea5e9', bg: 'bg-sky-100', ring: 'ring-sky-400' },
] as const;

export const ENERGY_LABELS = ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito alta'];

export const EMOTIONS = [
  { key: 'feliz', label: 'Feliz', emoji: '😊' },
  { key: 'calmo', label: 'Calmo(a)', emoji: '😌' },
  { key: 'grato', label: 'Grato(a)', emoji: '🙏' },
  { key: 'motivado', label: 'Motivado(a)', emoji: '💪' },
  { key: 'confiante', label: 'Confiante', emoji: '😎' },
  { key: 'ansioso', label: 'Ansioso(a)', emoji: '😰' },
  { key: 'triste', label: 'Triste', emoji: '😔' },
  { key: 'irritado', label: 'Irritado(a)', emoji: '😠' },
  { key: 'cansado', label: 'Cansado(a)', emoji: '🥱' },
  { key: 'estressado', label: 'Estressado(a)', emoji: '😫' },
  { key: 'sozinho', label: 'Sozinho(a)', emoji: '🫥' },
  { key: 'entediado', label: 'Entediado(a)', emoji: '😑' },
];

export const FACTORS = [
  { key: 'sono', label: 'Sono', emoji: '🛏️' },
  { key: 'exercicio', label: 'Exercício físico', emoji: '🏃' },
  { key: 'familia', label: 'Família', emoji: '👨‍👩‍👧' },
  { key: 'amigos', label: 'Amigos', emoji: '🧑‍🤝‍🧑' },
  { key: 'escola', label: 'Escola / estudos', emoji: '📚' },
  { key: 'trabalho', label: 'Trabalho', emoji: '💼' },
  { key: 'alimentacao', label: 'Alimentação', emoji: '🥗' },
  { key: 'saude', label: 'Saúde', emoji: '🩺' },
  { key: 'lazer', label: 'Lazer', emoji: '🎮' },
  { key: 'clima', label: 'Clima', emoji: '🌦️' },
  { key: 'redes_sociais', label: 'Redes sociais', emoji: '📱' },
  { key: 'financas', label: 'Finanças', emoji: '💰' },
];

export const ROLES: { value: Role; label: string }[] = [
  { value: 'ESTUDANTE', label: 'Estudante' },
  { value: 'PROFESSOR', label: 'Professor(a)' },
  { value: 'FUNCIONARIO', label: 'Funcionário(a)' },
  { value: 'COMUNIDADE', label: 'Membro da comunidade' },
];

export function moodInfo(value: number) {
  return MOODS[Math.min(5, Math.max(1, Math.round(value))) - 1];
}

export function emotionInfo(key: string) {
  return EMOTIONS.find((e) => e.key === key) ?? { key, label: key, emoji: '•' };
}

export function factorInfo(key: string) {
  return FACTORS.find((f) => f.key === key) ?? { key, label: key, emoji: '•' };
}
