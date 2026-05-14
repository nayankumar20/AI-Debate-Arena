import { cn } from '@/utils/cn';

type BrandLogoProps = {
  className?: string;
  size?: 'sm' | 'md';
};

const sizeMap = { sm: 'h-8 w-8 text-[10px]', md: 'h-9 w-9 text-xs' };

/**
 * “DA” orb — Debate Arena mark. Cyan → violet glow, minimal SaaS identity.
 */
export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-xl font-display font-bold tracking-tight text-white',
        sizeMap[size],
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-violet-600 opacity-[0.95]" />
      <span className="absolute inset-0 rounded-xl opacity-70 blur-md bg-gradient-to-br from-sky-400 to-violet-500" />
      <span className="absolute inset-[2px] rounded-[10px] bg-slate-100 dark:bg-[#0b1120]" />
      <span className="relative bg-gradient-to-br from-sky-500 to-violet-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgb(56_189_248/0.35)]">
        DA
      </span>
    </div>
  );
}
