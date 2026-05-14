import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20 hover:brightness-[1.06] active:scale-[0.99] dark:shadow-sky-900/40',
  secondary:
    'glass text-ink border border-ringline hover:border-sky-500/25 hover:bg-sky-500/[0.04] dark:hover:border-white/10',
  ghost: 'text-ink-muted hover:text-ink hover:bg-black/[0.04] dark:hover:bg-white/[0.05]',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className={cn(
            'h-4 w-4 animate-spin rounded-full border-2 border-t-transparent',
            variant === 'primary' || variant === 'danger'
              ? 'border-white/35 border-t-white'
              : 'border-slate-400/30 border-t-sky-400 dark:border-slate-500/40'
          )}
        />
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
