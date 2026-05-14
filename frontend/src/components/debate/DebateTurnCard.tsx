import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { DebateTurn } from '@/types/debate';
import { DebateMessageBody } from '@/components/debate/DebateMessageBody';
import { useRevealText } from '@/hooks/useRevealText';

export function DebateTurnCard({
  turn,
  index,
  streamReveal = false,
  onStreamComplete,
  onRevealProgress,
  showFallbackChip = true,
}: {
  turn: DebateTurn;
  index: number;
  streamReveal?: boolean;
  onStreamComplete?: () => void;
  onRevealProgress?: () => void;
  showFallbackChip?: boolean;
}) {
  const isA = turn.side === 'A';
  const revealed = useRevealText(turn.content, streamReveal, onStreamComplete, onRevealProgress);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, delay: Math.min(index * 0.04, 0.12) }}
      className={cn('flex w-full', isA ? 'justify-start' : 'justify-end')}
    >
      <div
        className={cn(
          'max-w-[min(100%,720px)] rounded-2xl border px-4 py-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-sm sm:px-6 sm:py-5 dark:ring-white/[0.06]',
          isA
            ? 'border-indigo-200/80 bg-gradient-to-br from-white/95 via-white/90 to-indigo-50/50 text-ink dark:border-indigo-500/25 dark:from-slate-950/70 dark:via-slate-950/55 dark:to-indigo-950/35'
            : 'border-sky-200/80 bg-gradient-to-br from-white/95 via-white/90 to-sky-50/45 text-ink dark:border-sky-500/25 dark:from-slate-950/70 dark:via-slate-950/55 dark:to-sky-950/30'
        )}
      >
        <header className="flex flex-wrap items-center gap-2 border-b border-black/[0.04] pb-3 text-xs text-ink-muted dark:border-white/[0.08]">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              isA
                ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-50'
                : 'bg-sky-100 text-sky-950 dark:bg-sky-500/15 dark:text-sky-50'
            )}
          >
            Side {turn.side}
          </span>
          <span className="font-semibold text-ink">Round {turn.round}</span>
          <span className="max-w-[200px] truncate font-medium text-ink">{turn.modelLabel}</span>
          {streamReveal ? (
            <span className="ml-auto rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-100">
              Streaming in
            </span>
          ) : null}
          {showFallbackChip && turn.usedFallback ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
              Demo mode
            </span>
          ) : null}
        </header>

        <div className="mt-4">
          <DebateMessageBody text={revealed} variant={isA ? 'A' : 'B'} />
        </div>
      </div>
    </motion.article>
  );
}
