export type Role = 'ESTUDANTE' | 'PROFESSOR' | 'FUNCIONARIO' | 'COMUNIDADE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  consentAt: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface Feedback {
  susAnswers: number[];
  susScore: number;
  usefulness: number;
  selfAwareness: number;
  liked: string | null;
  improve: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackResults {
  total: number;
  minGroupSize: number;
  sus: {
    average: number | null;
    median: number | null;
    standardDeviation: number | null;
    min: number | null;
    max: number | null;
    grade: string | null;
    label: string | null;
    distribution: { grade: string; label: string; count: number }[];
    questions: { number: number; positive: boolean; average: number | null }[];
  };
  usefulness: { average: number | null; distribution: { value: number; count: number }[] };
  selfAwareness: { average: number | null; distribution: { value: number; count: number }[] };
  entriesAverage: number | null;
  byRole: {
    role: Role;
    count: number;
    hidden: boolean;
    susAverage: number | null;
    usefulness: number | null;
    selfAwareness: number | null;
  }[];
  comments: { role: Role | null; liked: string | null; improve: string | null }[];
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
