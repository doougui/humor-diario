export const EMOTION_KEYS = [
  'feliz',
  'calmo',
  'grato',
  'motivado',
  'confiante',
  'ansioso',
  'triste',
  'irritado',
  'cansado',
  'estressado',
  'sozinho',
  'entediado',
] as const;

export const FACTOR_KEYS = [
  'sono',
  'exercicio',
  'familia',
  'amigos',
  'escola',
  'trabalho',
  'alimentacao',
  'saude',
  'lazer',
  'clima',
  'redes_sociais',
  'financas',
] as const;

export type FactorKey = (typeof FACTOR_KEYS)[number];

export const FACTOR_LABELS: Record<FactorKey, string> = {
  sono: 'Sono',
  exercicio: 'Exercício físico',
  familia: 'Família',
  amigos: 'Amigos',
  escola: 'Escola / estudos',
  trabalho: 'Trabalho',
  alimentacao: 'Alimentação',
  saude: 'Saúde',
  lazer: 'Lazer',
  clima: 'Clima',
  redes_sociais: 'Redes sociais',
  financas: 'Finanças',
};

export const WEEKDAY_LABELS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export const ROLES = ['ESTUDANTE', 'PROFESSOR', 'FUNCIONARIO', 'COMUNIDADE'] as const;

export const TOKEN_COOKIE = 'token';
