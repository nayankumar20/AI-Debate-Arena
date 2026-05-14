import { cn } from '@/utils/cn';

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderRichLine(line: string, variant: 'A' | 'B') {
  const safe = escapeHtml(line);
  const parts = safe.split(/\*\*/);
  const strongClass =
    variant === 'A'
      ? 'font-semibold text-indigo-950 underline decoration-indigo-300/70 decoration-2 underline-offset-2 dark:text-indigo-50'
      : 'font-semibold text-sky-950 underline decoration-sky-300/70 decoration-2 underline-offset-2 dark:text-sky-50';
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <strong key={idx} className={strongClass}>
        {part}
      </strong>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

export function DebateMessageBody({
  text,
  variant,
}: {
  text: string;
  variant: 'A' | 'B';
}) {
  const paragraphs = text
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((p, idx) => (
        <p
          key={idx}
          className={cn(
            'text-[15px] leading-relaxed text-ink sm:text-base',
            idx === 0 && 'rounded-r-xl border-l-2 py-1 pl-4 pr-1',
            idx === 0 && variant === 'A' && 'border-indigo-400/70 bg-indigo-500/[0.06]',
            idx === 0 && variant === 'B' && 'border-sky-400/70 bg-sky-500/[0.06]'
          )}
        >
          {renderRichLine(p, variant)}
        </p>
      ))}
    </div>
  );
}
