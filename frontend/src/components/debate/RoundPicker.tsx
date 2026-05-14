import { cn } from '@/utils/cn';

export function RoundPicker({
  value,
  onChange,
  options,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  options: readonly number[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Rounds</span>
      <div className="flex flex-wrap gap-2">
        {options.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              className={cn(
                'min-w-[72px] rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                active
                  ? 'border-transparent bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'glass border-ringline text-ink hover:border-indigo-300/50 dark:border-white/10',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {n} rounds
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-muted">Each round includes Side A then Side B (two turns per round).</p>
    </div>
  );
}
