import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="block space-y-1.5" htmlFor={inputId}>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </span>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-ringline bg-white/80 px-4 py-3 text-sm text-ink shadow-inner outline-none transition placeholder:text-slate-400 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/15 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      </label>
    );
  }
);
Input.displayName = 'Input';
