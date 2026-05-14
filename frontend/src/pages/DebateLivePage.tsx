import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { DebateTypingIndicator } from '@/components/debate/DebateTypingIndicator';
import { DebateTurnCard } from '@/components/debate/DebateTurnCard';
import { LiveArenaStatusBar } from '@/components/debate/LiveArenaStatusBar';
import { getDebateApi, startDebateStepWithRetry } from '@/services/debateService';
import { formatApiError } from '@/utils/errors';
import { sleep } from '@/utils/sleep';
import type { Debate } from '@/types/debate';

const MIN_TYPING_MS = 720;
const PAUSE_BETWEEN_TURNS_MS = 2600;

function totalTurns(d: Debate) {
  return d.totalRounds * 2;
}

function nextComposerCopy(debate: Debate) {
  const n = debate.turns.length;
  const round = Math.floor(n / 2) + 1;
  const side = n % 2 === 0 ? 'A' : 'B';
  const label = side === 'A' ? debate.sideALabel : debate.sideBLabel;
  return { round, side, label: label || (side === 'A' ? debate.sideAModelId : debate.sideBModelId) };
}

export function DebateLivePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [streamTargetId, setStreamTargetId] = useState<string | null>(null);
  const [typingLine, setTypingLine] = useState<string | null>(null);
  const [error, setError] = useState('');
  const cancelRef = useRef(false);
  const autoConsumedRef = useRef(false);
  const sequenceLockRef = useRef(false);
  const arenaTailRef = useRef<HTMLDivElement>(null);
  const typingAnchorRef = useRef<HTMLDivElement>(null);
  const lastScrollAt = useRef(0);

  const onStreamComplete = useCallback(() => {
    setStreamTargetId(null);
  }, []);

  const smoothScrollTo = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const now = Date.now();
    if (now - lastScrollAt.current < 100) return;
    lastScrollAt.current = now;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  }, []);

  const scrollToLatest = useCallback(() => {
    if (typingLine && typingAnchorRef.current) {
      smoothScrollTo(typingAnchorRef.current);
      return;
    }
    smoothScrollTo(arenaTailRef.current);
  }, [smoothScrollTo, typingLine]);

  useLayoutEffect(() => {
    scrollToLatest();
  }, [debate?.turns.length, typingLine, streamTargetId, scrollToLatest]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const d = await getDebateApi(id);
      setDebate(d);
      setStreamTargetId(null);
    } catch (e) {
      setError(formatApiError(e, 'Failed to load debate'));
      setDebate(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const progress = useMemo(() => {
    if (!debate) return 0;
    return Math.min(1, debate.turns.length / totalTurns(debate));
  }, [debate]);

  const handleRevealTick = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollAt.current < 140) return;
    lastScrollAt.current = now;
    requestAnimationFrame(() => {
      arenaTailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const runSequence = useCallback(async () => {
    if (!id) return;
    if (sequenceLockRef.current) return;
    sequenceLockRef.current = true;
    cancelRef.current = false;
    setRunning(true);
    setError('');
    try {
      let local = await getDebateApi(id);
      setDebate(local);
      while (!cancelRef.current) {
        if (local.turns.length >= totalTurns(local)) break;
        const { round, side, label } = nextComposerCopy(local);
        const phase =
          side === 'B'
            ? 'Live rebuttal: answer their last beat first — tight, pointed, no essay drift.'
            : round === 1
              ? 'Opening lane: thesis + one concrete stake — make Side B work hard.'
              : 'Counter-pressure: fix their frame, then advance your strongest mechanism.';
        setTypingLine(`Side ${side} · ${label}\n${phase} · Round ${round}`);
        await sleep(MIN_TYPING_MS);
        const result = await startDebateStepWithRetry(id);
        setTypingLine(null);
        local = result.debate;
        const latest = result.debate.turns[result.debate.turns.length - 1];
        setStreamTargetId(latest?.id ?? null);
        setDebate(result.debate);
        if (result.completed || local.turns.length >= totalTurns(local)) {
          await sleep(700);
          navigate(`/debate/${id}/results`, { replace: true });
          return;
        }
        await sleep(PAUSE_BETWEEN_TURNS_MS);
      }
    } catch (e) {
      setTypingLine(null);
      setStreamTargetId(null);
      setError(formatApiError(e, 'Debate engine paused due to an error'));
    } finally {
      setRunning(false);
      sequenceLockRef.current = false;
    }
  }, [id, navigate]);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!debate || !id) return;
    const autoStartKey = `ada-debate-autostart-${id}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(autoStartKey)) return;

    const wantsAuto = Boolean((location.state as { autoStart?: boolean } | null)?.autoStart);
    if (!wantsAuto) return;
    if (debate.turns.length > 0 || debate.status === 'completed') return;
    if (autoConsumedRef.current) return;
    autoConsumedRef.current = true;

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(autoStartKey, '1');
    }
    navigate(location.pathname, { replace: true, state: {} });
    void runSequence();
  }, [debate, id, location.pathname, navigate, runSequence]);

  const needsResume =
    debate &&
    debate.status !== 'completed' &&
    debate.turns.length > 0 &&
    debate.turns.length < totalTurns(debate);

  if (loading && !debate) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-300" />
      </div>
    );
  }

  if (!debate || !id) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-ink-muted">{error || 'Debate not available.'}</p>
        <Link to="/debate/create" className="mt-4 inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-300">
          ← Back to setup
        </Link>
      </div>
    );
  }

  const hasFallback = Boolean(debate.hasAnyFallback);
  const isLive = running || Boolean(typingLine) || Boolean(streamTargetId);

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-gradient-to-b from-indigo-500/15 via-transparent to-transparent blur-3xl dark:from-indigo-500/10" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-300">
            Live arena
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{debate.topic}</h1>
          <p className="mt-2 text-sm text-ink-muted sm:text-base">
            {debate.sideALabel} <span className="text-ink">vs</span> {debate.sideBLabel} · {debate.totalRounds} rounds ·{' '}
            {totalTurns(debate)} turns total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/debate/create">
            <Button variant="secondary" className="px-4 py-2 text-sm">
              New setup
            </Button>
          </Link>
          {debate.status === 'completed' ? (
            <Link to={`/debate/${id}/results`}>
              <Button className="px-4 py-2 text-sm">View results</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <LiveArenaStatusBar hasAnyFallback={hasFallback} isLive={isLive} />

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/50 ring-1 ring-black/5 dark:bg-slate-900/60 dark:ring-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>

      {error ? (
        <Card className="mt-6 border border-amber-200/80 bg-amber-50/60 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          {error}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="px-4 py-2 text-sm" variant="secondary" onClick={() => void load()}>
              Reload state
            </Button>
            {needsResume ? (
              <Button className="px-4 py-2 text-sm" loading={running} onClick={() => void runSequence()}>
                Resume debate
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {needsResume && !running ? (
        <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
          <span>This debate has unfinished turns. Resume to continue sequentially.</span>
          <Button className="px-4 py-2 text-sm" loading={running} onClick={() => void runSequence()}>
            Resume debate
          </Button>
        </Card>
      ) : null}

      <div className="relative mt-8 space-y-5">
        <div className="pointer-events-none absolute inset-x-6 top-0 hidden h-32 rounded-full bg-gradient-to-b from-white/40 to-transparent blur-2xl dark:from-white/5 md:block" />
        {debate.turns.map((turn, idx) => (
          <DebateTurnCard
            key={turn.id ?? `${turn.round}-${turn.side}-${idx}`}
            turn={turn}
            index={idx}
            streamReveal={Boolean(streamTargetId && turn.id && streamTargetId === turn.id)}
            onStreamComplete={onStreamComplete}
            onRevealProgress={streamTargetId && turn.id === streamTargetId ? handleRevealTick : undefined}
            showFallbackChip={Boolean(turn.usedFallback)}
          />
        ))}
        <div ref={arenaTailRef} className="h-2 w-full scroll-mt-24" aria-hidden />
      </div>

      <div ref={typingAnchorRef} className="mt-6 scroll-mt-32">
        <AnimatePresence>
          {typingLine ? (
            <div className="ring-2 ring-indigo-500/15 ring-offset-2 ring-offset-transparent transition-shadow dark:ring-indigo-400/20">
              <DebateTypingIndicator label={typingLine} />
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      {debate.turns.length === 0 && !running && !error ? (
        <Card className="mt-6 text-sm text-ink-muted">
          <p>When you land from the setup wizard, the arena auto-starts. Otherwise launch manually.</p>
          <Button
            className="mt-4 px-4 py-2 text-sm"
            loading={running}
            onClick={() => {
              void runSequence();
            }}
          >
            Begin live sequence
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
