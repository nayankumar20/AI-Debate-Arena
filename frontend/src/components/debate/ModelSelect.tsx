import { cn } from '@/utils/cn';
import type { AiModelOption } from '@/constants/aiModels';

export function ModelSelect({
  label,
  value,
  onChange,
  models,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  models: AiModelOption[];
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="relative">
        <select
          className={cn(
            'w-full appearance-none rounded-xl border border-ringline bg-white/85 px-4 py-3 pr-10 text-sm font-medium text-ink shadow-inner outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · {m.family}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted">
          ▾
        </span>
      </div>
    </label>
  );
}
