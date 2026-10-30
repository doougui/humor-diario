export type Role = 'ESTUDANTE' | 'PROFESSOR' | 'FUNCIONARIO' | 'COMUNIDADE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  consentAt: string;
  createdAt: string;
}

export interface Entry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  sleepHours: number | null;
  emotions: string[];
  factors: string[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  period: { days: number; from: string; to: string };
  stats: {
    entries: number;
    moodAverage: number | null;
    previousMoodAverage: number | null;
    energyAverage: number | null;
    sleepAverage: number | null;
    streak: number;
    adherence: number;
  };
  timeline: { date: string; mood: number; energy: number; sleepHours: number | null }[];
  distribution: { mood: number; count: number }[];
  byWeekday: { weekday: number; label: string; average: number | null; count: number }[];
  factors: { factor: string; label: string; count: number; average: number | null; impact: number | null }[];
  emotions: { emotion: string; count: number }[];
  sleep: { label: string; average: number | null; count: number }[];
  insights: string[];
}
