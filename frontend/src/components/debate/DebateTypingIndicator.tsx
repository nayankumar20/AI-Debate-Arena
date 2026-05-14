import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function DebateTypingIndicator({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const [title, ...rest] = label.split('\n');
  const detail = rest.join('\n').trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28 }}
      className={cn(
        'glass flex max-w-xl flex-col gap-1 rounded-2xl px-4 py-3 text-sm text-ink-muted shadow-md sm:flex-row sm:items-center sm:gap-3',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full items-start justify-between gap-3 sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0 sm:mt-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{title}</p>
            {detail ? <p className="mt-0.5 text-xs text-ink-muted sm:text-[13px]">{detail}</p> : null}
          </div>
        </div>
        <span className="mt-1 flex shrink-0 gap-1 sm:mt-0">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-indigo-400/80"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}
