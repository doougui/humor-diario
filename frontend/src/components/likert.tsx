'use client';

import { LIKERT_LABELS } from '@/lib/feedback';

// Escala de concordância de 1 (discordo totalmente) a 5 (concordo totalmente)
export function LikertScale({
  id,
  question,
  number,
  value,
  onChange,
}: {
  id: string;
  question: string;
  number?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="border-b border-slate-100 py-4 last:border-0">
      <legend id={`${id}-legend`} className="mb-3 text-sm font-medium text-slate-800 sm:text-base">
        {number !== undefined && <span className="mr-1.5 text-slate-400">{number}.</span>}
        {question}
      </legend>
      <div role="radiogroup" aria-labelledby={`${id}-legend`} className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {LIKERT_LABELS.map((label, index) => {
          const option = index + 1;
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              onClick={() => onChange(option)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                selected ? 'border-brand-500 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-base font-bold">{option}</span>
              <span className="hidden text-[11px] leading-tight sm:block">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500 sm:hidden" aria-hidden>
        <span>{LIKERT_LABELS[0]}</span>
        <span>{LIKERT_LABELS[4]}</span>
      </div>
    </fieldset>
  );
}
