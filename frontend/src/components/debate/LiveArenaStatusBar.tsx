import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function LiveArenaStatusBar({
  hasAnyFallback,
  isLive,
}: {
  hasAnyFallback: boolean;
  isLive: boolean;
}) {
  if (hasAnyFallback) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/50 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 shadow-sm backdrop-blur dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50"
      >
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        <span>
          <span className="font-semibold">Resilience mode:</span> one or more turns used scripted fallback while the
          arena kept the debate moving.
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mt-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm backdrop-blur',
        isLive
          ? 'border-emerald-300/50 bg-emerald-50/75 text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-50'
          : 'border-indigo-200/60 bg-white/70 text-ink dark:border-indigo-500/20 dark:bg-slate-950/50 dark:text-slate-100'
      )}
    >
      <span
        className={cn(
          'inline-flex h-2 w-2 rounded-full',
          isLive ? 'animate-pulse bg-emerald-500' : 'bg-sky-400'
        )}
      />
      <span>
        <span className="font-semibold">Live Arena —</span>{' '}
        {isLive
          ? 'AI models are debating in real time. Models are actively exchanging arguments live.'
          : 'Session complete — all debate rounds concluded successfully.'}
      </span>
    </motion.div>
  );
}
