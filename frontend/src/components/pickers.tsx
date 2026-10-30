'use client';

import { ENERGY_LABELS, MOODS } from '@/lib/constants';

export function MoodPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Humor" className="grid grid-cols-5 gap-2 sm:gap-3">
      {MOODS.map((mood) => {
        const selected = value === mood.value;
        return (
          <button
            key={mood.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mood.value)}
            className={`flex flex-col items-center gap-1 rounded-2xl border p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:p-3 ${
              selected ? `${mood.bg} border-transparent ring-2 ${mood.ring}` : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <span className={`text-3xl transition sm:text-4xl ${selected ? 'scale-110' : 'grayscale-[40%]'}`} aria-hidden>
              {mood.emoji}
            </span>
            <span className="text-center text-xs font-medium text-slate-700 sm:text-sm">{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EnergyPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Energia" className="grid grid-cols-5 gap-2">
      {ENERGY_LABELS.map((label, index) => {
        const level = index + 1;
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(level)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:text-sm ${
              selected ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-end gap-0.5" aria-hidden>
              {[1, 2, 3, 4, 5].map((bar) => (
                <span
                  key={bar}
                  className={`w-1.5 rounded-sm ${bar <= level ? (selected ? 'bg-brand-600' : 'bg-slate-400') : 'bg-slate-200'}`}
                  style={{ height: 4 + bar * 3 }}
                />
              ))}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

interface ChipOption {
  key: string;
  label: string;
  emoji: string;
}

export function ChipGroup({
  options,
  selected,
  onChange,
  label,
}: {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
}) {
  function toggle(key: string) {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option.key);
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              active ? 'border-brand-500 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span aria-hidden>{option.emoji}</span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
